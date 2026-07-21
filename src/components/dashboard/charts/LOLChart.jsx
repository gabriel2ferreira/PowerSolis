import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LOLTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateFormatted = format(new Date(label), "dd MMM yyyy", { locale: ptBR });
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
        <p className="text-sm font-semibold mb-1">{dateFormatted}</p>
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Perda Acumulada:</span> 
          <span className="font-bold text-destructive">{data.lol?.toFixed(2)}%</span>
        </p>
        {data.isProjected && <p className="text-xs text-orange-500 font-medium mt-1">* Valor Projetado</p>}
      </div>
    );
  }
  return null;
};

const LOLChart = ({ data, equipmentName }) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full">Sem dados disponíveis</div>;

  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold mb-4">{equipmentName} - Perda de Vida Útil (LOL)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--health-critical))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--health-attention))" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => format(new Date(tick), "MM/yyyy")}
            tick={{ fontSize: 12, opacity: 0.7 }}
            minTickGap={30}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, opacity: 0.7 }} tickFormatter={(val) => `${val}%`} />
          <Tooltip content={<LOLTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <ReferenceLine x={new Date().toISOString()} stroke="currentColor" strokeDasharray="5 5" opacity={0.5} label={{ position: 'top', value: 'Hoje', fill: 'currentColor', fontSize: 12 }} />

          <Line type="monotone" dataKey="lol" name="Perda Acumulada (%)" stroke="url(#colorLol)" strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LOLChart;