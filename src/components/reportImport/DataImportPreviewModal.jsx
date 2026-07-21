import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CUSTOM_FIELDS_KEYS = [
  'model', 'serial_number', 'sapid', 'voltage', 'current', 'power', 'frequency', 
  'temperature_limits', 'cooling_type', 'current_limits', 'voltage_limits', 
  'efficiency', 'power_factor', 'description', 'manufacturer'
];

const DataImportPreviewModal = ({ isOpen, onClose, mode, currentData, newData, onSuccess, fileName }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  
  // State for 'new' mode
  const [formData, setFormData] = useState({});
  
  // State for 'update' mode
  const [updateData, setUpdateData] = useState({});
  const [acceptedFields, setAcceptedFields] = useState({});

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from('equipment_types').select('id, name');
      if (data) setTypes(data);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'new') {
      setFormData({
        name: newData.name || '',
        equipment_type_id: newData.equipment_type_id || '',
        model: newData.model || '',
        serial_number: newData.serialNumber || newData.serial_number || '',
        sapid: newData.sapid || '',
        voltage_level: newData.voltage_level || newData.specifications?.voltage || '',
        phase: newData.phase || '',
        
        location_name: newData.location_name || '',
        city: newData.city || newData.location?.city || '',
        state: newData.state || newData.location?.state || '',
        latitude: newData.latitude || newData.location?.latitude || '',
        longitude: newData.longitude || newData.location?.longitude || '',
        installation_date: newData.installation_date || '',
        
        temperature: newData.temperature || newData.technicalData?.temperature || '',
        voltage: newData.voltage || '',
        current: newData.current || '',
        power: newData.power || '',
        frequency: newData.frequency || '',
        
        status: newData.status || 'Bom',
        lifespan_years: newData.lifespan_years || '',
        equipment_lifespan: newData.equipment_lifespan || '25',
        
        temperature_limits: newData.temperature_limits || '',
        cooling_type: newData.cooling_type || '',
        
        current_limits: newData.current_limits || '',
        voltage_limits: newData.voltage_limits || '',
        
        efficiency: newData.efficiency || '',
        power_factor: newData.power_factor || '',
        
        observations: newData.observations || '',
        description: newData.description || '',
        manufacturer: newData.manufacturer || ''
      });
    } else if (mode === 'update' && currentData) {
      // Build differences
      const preparedUpdates = {};
      const accepted = {};
      
      const checkAndAdd = (key, currentVal, newVal) => {
        if (newVal && String(newVal).trim() !== '' && String(currentVal) !== String(newVal)) {
          preparedUpdates[key] = String(newVal);
          accepted[key] = true;
        }
      };

      // Basic
      checkAndAdd('voltage_level', currentData.voltage_level, newData.voltage_level || newData.specifications?.voltage);
      checkAndAdd('temperature', currentData.temperature, newData.temperature || newData.technicalData?.temperature);
      
      // Map extracted specs to our custom fields
      checkAndAdd('model', currentData.model, newData.model);
      checkAndAdd('manufacturer', currentData.manufacturer, newData.manufacturer);
      checkAndAdd('serial_number', currentData.serial_number, newData.serialNumber || newData.serial_number);
      
      if (newData.specifications) {
         Object.entries(newData.specifications).forEach(([k, v]) => checkAndAdd(`spec_${k}`, '', v));
      }
      if (newData.technicalData) {
         Object.entries(newData.technicalData).forEach(([k, v]) => checkAndAdd(`tech_${k}`, '', v));
      }

      setUpdateData(preparedUpdates);
      setAcceptedFields(accepted);
    }
  }, [isOpen, mode, currentData, newData]);

  const handleSaveNew = async () => {
    if (!formData.name || !formData.equipment_type_id) {
      toast({ title: 'Erro', description: 'Nome e Tipo são obrigatórios.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Equipment
      const { data: newEq, error: eqError } = await supabase.from('equipments').insert({
        name: formData.name,
        equipment_type_id: formData.equipment_type_id,
        voltage_level: formData.voltage_level,
        phase: formData.phase,
        location_name: formData.location_name,
        city: formData.city,
        state: formData.state,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        installation_date: formData.installation_date ? new Date(formData.installation_date).toISOString() : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        status: formData.status,
        lifespan_years: formData.lifespan_years ? parseFloat(formData.lifespan_years) : null,
        equipment_lifespan: formData.equipment_lifespan ? parseInt(formData.equipment_lifespan) : null,
        observations: formData.observations,
        created_by: user.id
      }).select().single();

      if (eqError) throw eqError;

      // 2. Insert Custom Fields
      const customFields = CUSTOM_FIELDS_KEYS.map(key => ({
        equipment_id: newEq.id,
        field_name: key,
        field_type: 'text',
        observations: formData[key] || ''
      })).filter(cf => cf.observations !== '');

      if (customFields.length > 0) {
        await supabase.from('custom_fields').insert(customFields);
      }

      // 3. Log History
      await supabase.from('equipment_data_history').insert({
        equipment_id: newEq.id,
        report_date: new Date().toISOString(),
        health_percentage: 100,
        other_metrics: newData,
        source: `PDF Import: ${fileName}`
      });

      toast({ title: 'Sucesso', description: 'Equipamento importado com sucesso!' });
      onSuccess(newEq);
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpdate = async () => {
    setLoading(true);
    try {
      const updates = { updated_at: new Date().toISOString() };
      const customFieldsData = [];

      Object.keys(acceptedFields).forEach(key => {
        if (acceptedFields[key]) {
          const val = updateData[key];
          if (['voltage_level', 'temperature'].includes(key)) {
            updates[key] = key === 'temperature' ? parseFloat(val) : val;
          } else {
            customFieldsData.push({
              equipment_id: currentData.id,
              field_name: key,
              field_type: 'text',
              observations: val
            });
          }
        }
      });

      if (Object.keys(updates).length > 1) {
        await supabase.from('equipments').update(updates).eq('id', currentData.id);
      }

      for (const cf of customFieldsData) {
        const { data: existing } = await supabase.from('custom_fields')
          .select('id').eq('equipment_id', currentData.id).eq('field_name', cf.field_name).single();

        if (existing) {
          await supabase.from('custom_fields').update({ observations: cf.observations }).eq('id', existing.id);
        } else {
          await supabase.from('custom_fields').insert(cf);
        }
      }

      await supabase.from('equipment_data_history').insert({
        equipment_id: currentData.id,
        report_date: new Date().toISOString(),
        health_percentage: currentData.last_health_percentage || 100,
        other_metrics: newData,
        source: `PDF Import Update: ${fileName}`
      });

      toast({ title: 'Sucesso', description: 'Equipamento atualizado com sucesso!' });
      onSuccess(currentData);
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (mode === 'new') handleSaveNew();
    else handleSaveUpdate();
  };

  const renderSection = (title, children) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-primary">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{mode === 'new' ? 'Pré-visualizar Novo Equipamento' : 'Revisar Atualização de Equipamento'}</DialogTitle>
          <DialogDescription>
            {mode === 'new' 
              ? 'Revise e edite todos os campos extraídos antes de salvar.' 
              : 'Selecione quais alterações deseja aplicar ao equipamento existente.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          {mode === 'new' ? (
            <div className="space-y-2">
              {renderSection('Informações Básicas', <>
                <div className="space-y-2"><Label>Nome *</Label><Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.equipment_type_id} onValueChange={v => setFormData({...formData, equipment_type_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Modelo</Label><Input value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
                <div className="space-y-2"><Label>Número de Série</Label><Input value={formData.serial_number || ''} onChange={e => setFormData({...formData, serial_number: e.target.value})} /></div>
                <div className="space-y-2"><Label>SAP ID</Label><Input value={formData.sapid || ''} onChange={e => setFormData({...formData, sapid: e.target.value})} /></div>
                <div className="space-y-2"><Label>Nível de Tensão</Label><Input value={formData.voltage_level || ''} onChange={e => setFormData({...formData, voltage_level: e.target.value})} /></div>
                <div className="space-y-2"><Label>Fase</Label><Input value={formData.phase || ''} onChange={e => setFormData({...formData, phase: e.target.value})} /></div>
              </>)}

              {renderSection('Localização & Instalação', <>
                <div className="space-y-2"><Label>Nome do Local</Label><Input value={formData.location_name || ''} onChange={e => setFormData({...formData, location_name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                <div className="space-y-2"><Label>Estado</Label><Input value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
                <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} /></div>
                <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} /></div>
                <div className="space-y-2"><Label>Data de Instalação</Label><Input type="date" value={formData.installation_date || ''} onChange={e => setFormData({...formData, installation_date: e.target.value})} /></div>
              </>)}

              {renderSection('Especificações Técnicas', <>
                <div className="space-y-2"><Label>Temperatura Nominal (°C)</Label><Input type="number" step="any" value={formData.temperature || ''} onChange={e => setFormData({...formData, temperature: e.target.value})} /></div>
                <div className="space-y-2"><Label>Tensão (V)</Label><Input value={formData.voltage || ''} onChange={e => setFormData({...formData, voltage: e.target.value})} /></div>
                <div className="space-y-2"><Label>Corrente (A)</Label><Input value={formData.current || ''} onChange={e => setFormData({...formData, current: e.target.value})} /></div>
                <div className="space-y-2"><Label>Potência</Label><Input value={formData.power || ''} onChange={e => setFormData({...formData, power: e.target.value})} /></div>
                <div className="space-y-2"><Label>Frequência (Hz)</Label><Input value={formData.frequency || ''} onChange={e => setFormData({...formData, frequency: e.target.value})} /></div>
              </>)}

              {renderSection('Dados Operacionais', <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bom">Bom</SelectItem>
                      <SelectItem value="Atenção">Atenção</SelectItem>
                      <SelectItem value="Crítico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Vida Útil de Projeto (Anos)</Label><Input type="number" value={formData.equipment_lifespan || ''} onChange={e => setFormData({...formData, equipment_lifespan: e.target.value})} /></div>
                <div className="space-y-2"><Label>Expectativa de Vida (Anos)</Label><Input type="number" step="any" value={formData.lifespan_years || ''} onChange={e => setFormData({...formData, lifespan_years: e.target.value})} /></div>
              </>)}

              {renderSection('Dados Térmicos', <>
                <div className="space-y-2"><Label>Limites de Temperatura</Label><Input value={formData.temperature_limits || ''} onChange={e => setFormData({...formData, temperature_limits: e.target.value})} /></div>
                <div className="space-y-2"><Label>Tipo de Resfriamento</Label><Input value={formData.cooling_type || ''} onChange={e => setFormData({...formData, cooling_type: e.target.value})} /></div>
              </>)}

              {renderSection('Dados Elétricos', <>
                <div className="space-y-2"><Label>Limites de Corrente</Label><Input value={formData.current_limits || ''} onChange={e => setFormData({...formData, current_limits: e.target.value})} /></div>
                <div className="space-y-2"><Label>Limites de Tensão</Label><Input value={formData.voltage_limits || ''} onChange={e => setFormData({...formData, voltage_limits: e.target.value})} /></div>
              </>)}

              {renderSection('Dados de Desempenho', <>
                <div className="space-y-2"><Label>Eficiência (%)</Label><Input value={formData.efficiency || ''} onChange={e => setFormData({...formData, efficiency: e.target.value})} /></div>
                <div className="space-y-2"><Label>Fator de Potência</Label><Input value={formData.power_factor || ''} onChange={e => setFormData({...formData, power_factor: e.target.value})} /></div>
              </>)}

              {renderSection('Informações Adicionais', <>
                <div className="space-y-2"><Label>Fabricante</Label><Input value={formData.manufacturer || ''} onChange={e => setFormData({...formData, manufacturer: e.target.value})} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Descrição</Label><Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Observações</Label><Textarea value={formData.observations || ''} onChange={e => setFormData({...formData, observations: e.target.value})} /></div>
              </>)}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(updateData).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma alteração detectada.</div>
              ) : (
                <div className="border rounded-md divide-y">
                  <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-4 p-4 bg-muted/50 font-semibold items-center text-sm">
                    <div className="w-8">Inc</div>
                    <div>Campo</div>
                    <div className="text-center w-8"><ArrowRight className="w-4 h-4 mx-auto" /></div>
                    <div>Novo Valor (Editável)</div>
                  </div>
                  {Object.keys(updateData).map(key => (
                    <div key={key} className="grid grid-cols-[auto_1fr_auto_1fr] gap-4 p-4 items-center text-sm hover:bg-muted/20">
                      <div className="w-8">
                        <Checkbox 
                          checked={acceptedFields[key] || false} 
                          onCheckedChange={(checked) => setAcceptedFields({...acceptedFields, [key]: checked})}
                        />
                      </div>
                      <div className="font-medium truncate" title={key}>{key.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-center w-8"><ArrowRight className="w-4 h-4 mx-auto text-muted-foreground" /></div>
                      <div>
                        <Input 
                          value={updateData[key]} 
                          onChange={(e) => setUpdateData({...updateData, [key]: e.target.value})}
                          className={acceptedFields[key] ? "border-green-500 bg-green-50" : "bg-muted/50"}
                          disabled={!acceptedFields[key]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || (mode === 'update' && Object.keys(acceptedFields).every(k => !acceptedFields[k]))}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'new' ? 'Salvar Novo Equipamento' : 'Aplicar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataImportPreviewModal;