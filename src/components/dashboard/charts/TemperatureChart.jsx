import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TempTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isProjected) return null; // Temperature is only for historical points
    const dateFormatted = format(new Date(label), "dd MMM yyyy HH:mm", { locale: ptBR });
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
        <p className="text-sm font-semibold mb-1">{dateFormatted}</p>
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Temperatura:</span> 
          <span className="font-bold text-[hsl(var(--chart-temp))]">{data.temperature?.toFixed(1)}°C</span>
        </p>
      </div>
    );
  }
  return null;
};

const TemperatureChart = ({ data, equipmentName }) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full">Sem dados disponíveis</div>;

  // Filter out purely projected points that have null temperature
  const validData = data.filter(d => d.temperature !== null && d.temperature !== undefined);

  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold mb-4">{equipmentName} - Monitoramento Térmico</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={validData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => format(new Date(tick), "dd/MM")}
            tick={{ fontSize: 12, opacity: 0.7 }}
            minTickGap={30}
          />
          <YAxis tick={{ fontSize: 12, opacity: 0.7 }} tickFormatter={(val) => `${val}°C`} domain={['auto', 'auto']} />
          <Tooltip content={<TempTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <ReferenceLine y={110} stroke="hsl(var(--health-normal))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Normal (<110°C)', fill: 'currentColor', fontSize: 11 }} />
          <ReferenceLine y={130} stroke="hsl(var(--health-critical))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Crítico (>130°C)', fill: 'currentColor', fontSize: 11 }} />

          <Line type="monotone" dataKey="temperature" name="Temp. Hot-Spot (°C)" stroke="hsl(var(--chart-temp))" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureChart;