import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EquipmentSelector = ({ value, onChange }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipments = async () => {
      const { data } = await supabase
        .from('equipments')
        .select('id, name, equipment_types(name)');
      if (data) setEquipments(data);
      setLoading(false);
    };
    fetchEquipments();
  }, []);

  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium leading-none">Selecione o Equipamento</label>
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

export default EquipmentSelector;