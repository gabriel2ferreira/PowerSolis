import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateFormatted = format(new Date(label), "dd MMM yyyy", { locale: ptBR });
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
        <p className="text-sm font-semibold capitalize mb-1 text-foreground">{dateFormatted}</p>
        <p className="text-sm text-muted-foreground flex items-center justify-between gap-4">
          <span>Saúde:</span> <span className="font-bold text-foreground">{data.health.toFixed(2)}%</span>
        </p>
        {data.temperature && (
          <p className="text-sm text-muted-foreground flex items-center justify-between gap-4">
            <span>Temp:</span> <span className="font-bold text-foreground">{data.temperature}°C</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const LifeExpectancyChart = ({ data, equipmentName, standard }) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground">Calculando projeções...</div>;

  const now = new Date();
  let currentIndex = data.findIndex(d => new Date(d.date) > now);
  if (currentIndex === -1) currentIndex = data.length - 1;
  else if (currentIndex > 0) currentIndex -= 1;

  const currentPoint = data[currentIndex];

  return (
    <div id="life-expectancy-chart-container" className="chart-container bg-card p-4 rounded-xl border">
      <h3 className="text-lg font-bold mb-4 text-foreground">{equipmentName} - Curva de Saúde ({standard})</h3>
      <div className="w-full h-full bg-transparent">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHealthLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="95%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} stroke="currentColor" className="text-muted-foreground" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(tick) => format(new Date(tick), "MM/yyyy")}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-muted-foreground"
              minTickGap={30}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12, fill: 'currentColor' }} 
              className="text-muted-foreground"
              tickFormatter={(val) => `${val}%`} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <ReferenceLine y={50} stroke="#eab308" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'Atenção (50%)', fill: '#eab308', fontSize: 11 }} />
            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'Crítico (25%)', fill: '#ef4444', fontSize: 11 }} />

            <Line 
              type="monotone" 
              dataKey="health" 
              name="Saúde (%)" 
              stroke="url(#colorHealthLine)" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: "#ef4444", stroke: "currentColor", strokeWidth: 2 }}
              isAnimationActive={false} 
            />

            {currentPoint && (
              <Line 
                data={[currentPoint]} 
                type="monotone" 
                dataKey="health" 
                stroke="none" 
                dot={{ r: 6, fill: "hsl(var(--primary))", stroke: "currentColor", strokeWidth: 2 }} 
                isAnimationActive={false} 
                legendType="none"
                tooltipType="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LifeExpectancyChart;