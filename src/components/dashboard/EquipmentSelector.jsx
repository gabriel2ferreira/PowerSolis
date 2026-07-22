import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const EquipmentSelector = ({ equipmentList, selectedId, onSelect, loading }) => {
  return (
    <div className="w-full">
      <label className="text-sm font-medium mb-1.5 block">Selecione o Equipamento</label>
      <Select 
        value={selectedId || ""} 
        onValueChange={onSelect} 
        disabled={loading || equipmentList.length === 0}
      >
        <SelectTrigger className="w-full bg-background border-input">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando equipamentos...</span>
            </div>
          ) : (
            <SelectValue placeholder="Selecione um equipamento" />
          )}
        </SelectTrigger>
        <SelectContent>
          {equipmentList.map((eq) => (
            <SelectItem key={eq.id} value={eq.id}>
              {eq.name} <span className="text-muted-foreground text-xs ml-2">({eq.id.slice(0, 8)})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EquipmentSelector;