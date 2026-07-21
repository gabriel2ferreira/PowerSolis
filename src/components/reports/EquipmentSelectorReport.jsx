import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const EquipmentSelectorReport = ({ value, onChange }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const { data, error } = await supabase
          .from('equipments')
          .select('id, name, equipment_types(name)');
        
        if (error) throw error;
        if (data) setEquipments(data);
      } catch (err) {
        console.error(err);
        toast({ title: "Erro", description: "Falha ao carregar equipamentos.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEquipments();
  }, [toast]);

  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium leading-none text-foreground">Selecione o Equipamento</label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-full bg-background border-input text-foreground">
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione um equipamento"} />
        </SelectTrigger>
        <SelectContent>
          {equipments.map((eq) => (
            <SelectItem key={eq.id} value={eq.id}>
              {eq.name} <span className="text-muted-foreground text-xs ml-2">({eq.equipment_types?.name || 'Desconhecido'})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EquipmentSelectorReport;