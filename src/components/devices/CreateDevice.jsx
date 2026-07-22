import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const CreateDevice = ({ onComplete, defaultEquipmentId = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: 'Normal',
    equipment_id: defaultEquipmentId || 'none'
  });

  useEffect(() => {
    const fetchEquipments = async () => {
      const { data } = await supabase.from('equipments').select('id, name').order('name');
      setEquipments(data || []);
    };
    fetchEquipments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast({ title: 'Erro', description: 'Nome e Tipo são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedEquipment = equipments.find(eq => eq.id === formData.equipment_id);
      
      const payload = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        equipment_id: formData.equipment_id !== 'none' ? formData.equipment_id : null,
        equipment_name: selectedEquipment ? selectedEquipment.name : null,
        // Assuming a dummy transformer_id since schema requires it as integer NOT NULL for old code compatibility
        transformer_id: 0 
      };

      const { error } = await supabase.from('devices').insert([payload]);
      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Dispositivo criado com sucesso!' });
      if (onComplete) onComplete();
      
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Novo Dispositivo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Dispositivo *</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Dispositivo *</Label>
            <Input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Ex: Sensor de Temperatura" required />
          </div>
          <div className="space-y-2">
            <Label>Equipamento Vinculado</Label>
            <Select value={formData.equipment_id} onValueChange={v => setFormData({...formData, equipment_id: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um equipamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum / Não vinculado</SelectItem>
                {equipments.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Criar Dispositivo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateDevice;