import React from 'react';
import { Slider } from "@/components/ui/slider";

const ForecastHorizonSlider = ({ value, onChange }) => {
  return (
    <div className="w-full bg-card border border-border p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <label className="text-sm font-medium">Horizonte de Previsão</label>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
          Próximos {value} anos
        </span>
      </div>
      
      <Slider
        defaultValue={[5]}
        value={[value]}
        min={1}
        max={11}
        step={1}
        onValueChange={(vals) => onChange(vals[0])}
        className="w-full mb-2"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>1 ano</span>
        <span>11 anos</span>
      </div>
    </div>
  );
};

export default ForecastHorizonSlider;