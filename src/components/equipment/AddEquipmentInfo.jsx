import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';

const AddEquipmentInfo = ({ equipmentId, onFinish }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({
    field_name: '',
    field_type: 'text',
    max_value: '',
    observations: ''
  });

  const fetchFields = useCallback(async () => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('equipment_id', equipmentId);
    
    if (error) {
      console.error('Error fetching fields:', error);
    } else {
      setFields(data);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleAddField = async () => {
    if (!newField.field_name) {
      toast({ title: t('missingName'), description: t('enterFieldName'), variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from('custom_fields')
      .insert({
        equipment_id: equipmentId,
        field_name: newField.field_name,
        field_type: newField.field_type,
        max_value: newField.max_value ? parseFloat(newField.max_value) : null,
        observations: newField.observations
      })
      .select()
      .single();

    if (error) {
      toast({ title: t('error'), description: error.message, variant: "destructive" });
    } else {
      setFields([...fields, data]);
      setNewField({ field_name: '', field_type: 'text', max_value: '', observations: '' });
      toast({ title: t('success'), description: t('fieldAdded') });
    }
  };

  const handleDeleteField = async (id) => {
    const { error } = await supabase.from('custom_fields').delete().eq('id', id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: "destructive" });
    } else {
      setFields(fields.filter(f => f.id !== id));
      toast({ title: t('deleted'), description: t('fieldRemoved') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('addNewCustomField')}</CardTitle>
            <CardDescription>{t('defineParameters')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('fieldName')}</Label>
              <Input 
                value={newField.field_name}
                onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                placeholder="e.g., Oil Pressure"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dataType')}</Label>
              <Select 
                value={newField.field_type} 
                onValueChange={(val) => setNewField({...newField, field_type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('text')}</SelectItem>
                  <SelectItem value="numeric">{t('numeric')}</SelectItem>
                  <SelectItem value="date">{t('date')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newField.field_type === 'numeric' && (
              <div className="space-y-2">
                <Label>{t('maxValue')}</Label>
                <Input 
                  type="number"
                  value={newField.max_value}
                  onChange={(e) => setNewField({...newField, max_value: e.target.value})}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('observations')}</Label>
              <Input 
                value={newField.observations}
                onChange={(e) => setNewField({...newField, observations: e.target.value})}
              />
            </div>
            <Button onClick={handleAddField} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> {t('addField')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('existingFields')}</CardTitle>
            <CardDescription>{t('customParameters')}</CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noCustomFields')}</p>
            ) : (
              <div className="space-y-2">
                {fields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{field.field_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.field_type} {field.max_value ? `(Max: ${field.max_value})` : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onFinish} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" /> {t('finishConfiguration')}
        </Button>
      </div>
    </div>
  );
};

export default AddEquipmentInfo;