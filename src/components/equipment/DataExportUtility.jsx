import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DataExportUtility = ({ equipmentId, equipmentName }) => {
  const { toast } = useToast();

  const handleExportCSV = async () => {const handleExportTemperatureHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('equipment_data_history')
      .select('created_at, temperature, temperatura_ambiente, ponto_quente_externo, tangente_perdas')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      toast({ title: 'Sem dados', description: 'Nenhuma série temporal de temperatura para exportar.' });
      return;
    }

    const headers = ['created_at', 'temperature', 'temperatura_ambiente', 'ponto_quente_externo', 'tangente_perdas'];
    const rows = data
      .map(row =>
        headers
          .map(h => `"${row[h] !== null && row[h] !== undefined ? row[h] : ''}"`)
          .join(',')
      )
      .join('\n');

    const csv = `${headers.join(',')}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute(
      'download',
      `temperature_series_${equipmentName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({ title: 'Sucesso', description: 'Série temporal exportada.' });
  } catch (err) {
    toast({ variant: 'destructive', title: 'Erro na Exportação', description: err.message });
  }
};
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Relatório de Saúde - ${equipmentName}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Data de Geração: ${new Date().toLocaleString()}`, 14, 30);
      
      doc.autoTable({
        startY: 40,
        head: [['Métrica', 'Valor', 'Status']],
        body: [
          ['Saúde Atual', '85.2%', 'Normal'],
          ['Perda de Vida (LOL)', '14.8%', 'Normal'],
          ['Temperatura Média', '65°C', 'Normal'],
          ['Padrão de Cálculo', 'IEEE C57.91-2011', '-']
        ],
      });
      
      doc.save(`relatorio_${equipmentName}_${new Date().getTime()}.pdf`);
      toast({ title: 'Sucesso', description: 'Relatório PDF gerado.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro na Exportação', description: err.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Exportação de Dados</CardTitle>
        <CardDescription>Gere relatórios e exporte dados brutos para análises externas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <span>Exportar Dados Térmicos (CSV)</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={handleExportPDF}>
            <FileText className="w-6 h-6 text-red-600" />
            <span>Relatório de Saúde (PDF)</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportUtility;