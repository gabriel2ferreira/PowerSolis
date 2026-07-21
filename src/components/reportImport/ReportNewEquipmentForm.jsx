import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ReportNewEquipmentForm = ({ extractedData, fileName, onBack, onPreview }) => {
  const { toast } = useToast();
  const [types, setTypes] = useState([]);

  const [formData, setFormData] = useState({
    name: extractedData.equipmentName || extractedData.name || '',
    equipment_type_id: '',
    equipment_lifespan: '25',
    phase: extractedData.phase || '',
    observations: extractedData.observations || '',
    city: extractedData.location?.city || extractedData.city || '',
    state: extractedData.location?.state || extractedData.state || '',
  });

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from('equipment_types').select('*');
      if (data) setTypes(data);
    };
    fetchTypes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.equipment_type_id || !formData.equipment_lifespan || !formData.phase) {
      toast({ title: 'Validação', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    // Pass merged data to preview
    const mergedData = {
      ...extractedData,
      ...formData
    };

    onPreview(mergedData);
  };

  return (
    <Card className="border-primary/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Informações Básicas Iniciais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Equipamento *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Equipamento *</Label>
              <Select value={formData.equipment_type_id} onValueChange={(v) => setFormData({...formData, equipment_type_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vida Útil Estimada *</Label>
              <Select value={formData.equipment_lifespan} onValueChange={(v) => setFormData({...formData, equipment_lifespan: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 Anos</SelectItem>
                  <SelectItem value="30">30 Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fase *</Label>
              <Select value={formData.phase} onValueChange={(v) => setFormData({...formData, phase: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fase A">Fase A</SelectItem>
                  <SelectItem value="Fase B">Fase B</SelectItem>
                  <SelectItem value="Fase ABC">Fase ABC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t mt-6">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button type="submit" disabled={!formData.equipment_type_id || !formData.name}>
              Continuar para Revisão <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportNewEquipmentForm;