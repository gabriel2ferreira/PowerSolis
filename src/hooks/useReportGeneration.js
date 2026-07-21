import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { generatePDFReport } from '@/utils/reportGenerator';
import { formatEquipmentData, calculateHealthStatus, calculateRemainingLife } from '@/utils/reportFormatter';
import { useReportStorage } from './useReportStorage';
import { useToast } from '@/components/ui/use-toast';

export const useReportGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { uploadPDF, saveReportMetadata } = useReportStorage();
  const { toast } = useToast();

  const generateReport = async (equipmentId) => {
    console.log('[REPORT_GENERATION] Triggered for equipment:', equipmentId);
    
    if (!equipmentId) {
      toast({ title: 'Erro', description: 'Selecione um equipamento.', variant: 'destructive' });
      return null;
    }

    setIsGenerating(true);
    try {
      // 1. Fetch Data
      console.log('[REPORT_GENERATION] Fetching equipment data...');
      const { data: eqData, error: eqError } = await supabase
        .from('equipments')
        .select('*, equipment_types(name)')
        .eq('id', equipmentId)
        .single();
        
      if (eqError) throw eqError;

      const { data: metricsData, error: metricsError } = await supabase
        .from('equipment_metrics')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('timestamp', { ascending: false })
        .limit(365);

      if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;

      const { data: transformerData } = await supabase
        .from('transformers')
        .select('id')
        .limit(1)
        .single();

      let alarmsData = [];
      if (transformerData?.id) {
         const { data } = await supabase
          .from('events')
          .select('*')
          .eq('transformer_id', transformerData.id)
          .order('timestamp', { ascending: false })
          .limit(20);
          alarmsData = data || [];
      }

      // 2. Format & Calculate
      console.log('[REPORT_GENERATION] Formatting and calculating data...');
      const equipment = formatEquipmentData(eqData);
      const health = calculateHealthStatus(metricsData);
      const remainingLife = calculateRemainingLife(metricsData);
      
      const reportDataJson = {
        equipment_snapshot: equipment,
        health_status: health,
        remaining_life: remainingLife,
        metrics_count: metricsData?.length || 0,
        alarms_count: alarmsData?.length || 0
      };

      // 3. Generate PDF Blob
      console.log('[REPORT_GENERATION] Generating PDF blob...');
      const pdfBlob = await generatePDFReport(equipment, metricsData, alarmsData, health, remainingLife);
      console.log('[REPORT_GENERATION] PDF generated, size:', pdfBlob.size);
      
      // 4. Upload to Storage
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split('T')[0].replace(/:/g, '-');
      const timestamp = new Date().getTime();
      const fileName = `${equipmentId}/${timestamp}-Relatorio-${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      const uploadResult = await uploadPDF(pdfBlob, fileName);

      // 5. Save Metadata to DB
      console.log('[REPORT_GENERATION] Saving metadata...');
      const savedReport = await saveReportMetadata({
        equipment_id: equipmentId,
        report_name: `Relatório Detalhado - ${equipment.name}`,
        report_date: new Date().toISOString(),
        file_path: uploadResult.path,
        file_url: uploadResult.url,
        file_size: pdfBlob.size,
        status: 'completed',
        report_data: reportDataJson
      });

      console.log('[REPORT_GENERATION] Completely finished. Saved report ID:', savedReport.id);
      return savedReport;
    } catch (error) {
      console.error('[REPORT_GENERATION] Fatal error:', error);
      toast({ title: 'Erro', description: 'Falha ao gerar o relatório. Verifique os logs e tente novamente.', variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateReport, isGenerating };
};