import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { getHealthPercentage } from '@/utils/healthDisplay';

const HealthHistoryGraph = ({ equipment }) => {
  const data = useMemo(() => {
    const rawEq = equipment.raw || equipment;
    if (!rawEq || !rawEq.installation_date) return null;

    const installationDate = new Date(rawEq.installation_date);
    const today = new Date();
    const vidaRemanescenteAnos = equipment.health?.vidaRemanescenteAnos || 0;

    const endOfLifeDate = new Date(today);
    endOfLifeDate.setFullYear(today.getFullYear() + Math.floor(vidaRemanescenteAnos));
    endOfLifeDate.setMonth(today.getMonth() + Math.floor((vidaRemanescenteAnos % 1) * 12));

    const healthToday = getHealthPercentage(equipment);

    const timelineData = [
      {
        date: installationDate.toLocaleDateString('pt-BR'),
        timestamp: installationDate.getTime(),
        health: 100,
        label: "Instalação"
      },
      {
        date: today.toLocaleDateString('pt-BR'),
        timestamp: today.getTime(),
        health: Number(healthToday.toFixed(1)),
        label: "Hoje",
        isCurrent: true
      },
      {
        date: endOfLifeDate.toLocaleDateString('pt-BR'),
        timestamp: endOfLifeDate.getTime(),
        health: 0,
        label: "Fim da Vida Útil"
      }
    ];

    return timelineData.sort((a, b) => a.timestamp - b.timestamp);
  }, [equipment]);

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Data de instalação não disponível para projetar o histórico de saúde.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 40 }}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                <stop offset="50%" stopColor="#eab308" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 12 }} 
            />
            <YAxis 
              domain={[0, 100]} 
              label={{ value: 'Saúde (%)', angle: -90, position: 'insideLeft', offset: 20 }}
              tick={{ fontSize: 12 }} 
            />
            <Tooltip 
              formatter={(value, name, props) => [`${value}%`, props.payload.label || 'Saúde']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line 
              type="monotone" 
              dataKey="health" 
              stroke="url(#colorHealth)" 
              strokeWidth={3} 
              dot={{ fill: '#3b82f6', r: 5 }} 
              activeDot={{ r: 7 }} 
              name="Progressão da Vida Útil" 
            />
            {data.map((entry, index) => 
              entry.isCurrent ? (
                <ReferenceDot 
                  key={`ref-${index}`}
                  x={entry.date} 
                  y={entry.health} 
                  r={8} 
                  fill="#ef4444" 
                  stroke="#dc2626" 
                  strokeWidth={2} 
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-xs text-muted-foreground font-medium uppercase">Data de Instalação</span>
          <span className="text-sm font-bold mt-1">{data[0]?.date}</span>
          <span className="text-sm text-green-600 font-medium">Saúde: 100%</span>
        </div>
        <div className="flex flex-col items-center sm:items-center text-center border-t sm:border-t-0 sm:border-l sm:border-r border-border pt-4 sm:pt-0">
          <span className="text-xs text-muted-foreground font-medium uppercase">Data Atual</span>
          <span className="text-sm font-bold mt-1">{data.find(d => d.isCurrent)?.date}</span>
          <span className="text-sm text-blue-600 font-medium">Saúde: {data.find(d => d.isCurrent)?.health}%</span>
        </div>
        <div className="flex flex-col items-center sm:items-end text-center sm:text-right border-t sm:border-t-0 border-border pt-4 sm:pt-0">
          <span className="text-xs text-muted-foreground font-medium uppercase">Previsão Fim de Vida</span>
          <span className="text-sm font-bold mt-1">{data[data.length - 1]?.date}</span>
          <span className="text-sm text-red-600 font-medium">Saúde: 0%</span>
        </div>
      </div>
    </div>
  );
};

export default HealthHistoryGraph;