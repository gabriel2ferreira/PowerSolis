import React, { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { generateEquipmentPDF } from '@/lib/equipmentUtils';
import { useLanguage } from '@/contexts/LanguageContext';

const CreateReport = ({ equipment }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchCustomFields = useCallback(async () => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('equipment_id', equipment.id);
    
    if (error) console.error(error);
    else setCustomFields(data);
  }, [equipment.id]);

  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const entries = Object.entries(values).map(([fieldId, value]) => ({
        equipment_id: equipment.id,
        custom_field_id: fieldId,
        value: value,
        recorded_by: user.id
      }));

      if (entries.length > 0) {
        const { error } = await supabase.from('equipment_data').insert(entries);
        if (error) throw error;
      }

      // Also create a report entry
      const { error: reportError } = await supabase.from('reports').insert({
        equipment_id: equipment.id,
        report_data: values,
        created_by: user.id
      });
      
      if (reportError) throw reportError;

      toast({ title: t('reportSaved'), description: t('dataLogged') });
      
      // Generate PDF
      // Fetch enriched data for PDF to show names instead of IDs
      const enrichedData = entries.map(e => {
        const field = customFields.find(f => f.id === e.custom_field_id);
        return { ...e, custom_fields: field, recorded_at: new Date() };
      });
      
      generateEquipmentPDF(equipment, enrichedData, []); // Pass history as [] or fetch it if needed
      
    } catch (error) {
      console.error(error);
      toast({ title: t('failedSaveReport'), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" /> {t('newReportEntry')}
        </CardTitle>
        <CardDescription>{t('logValuesFor').replace('{name}', equipment.name)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label>{field.field_name} <span className="text-xs text-muted-foreground">({field.field_type})</span></Label>
              <Input 
                type={field.field_type === 'numeric' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                value={values[field.id] || ''}
                onChange={(e) => setValues({...values, [field.id]: e.target.value})}
                placeholder={field.observations || ''}
              />
            </div>
          ))}
        </div>
        {customFields.length === 0 && <p className="text-muted-foreground italic">{t('noCustomFields')}</p>}
        
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? t('loading') : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" /> {t('saveGeneratePDF')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateReport;