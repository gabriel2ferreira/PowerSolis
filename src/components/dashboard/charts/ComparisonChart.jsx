import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const ComparisonTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
        <p className="text-sm font-bold mb-1">{data.name}</p>
        <p className="text-sm flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Saúde Restante:</span> 
          <span className={`font-bold ${data.health < 25 ? 'text-[hsl(var(--health-critical))]' : data.health < 50 ? 'text-[hsl(var(--health-attention))]' : 'text-[hsl(var(--health-normal))]'}`}>
            {data.health?.toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const ComparisonChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-full">Sem dados disponíveis</div>;

  const sortedData = [...data].sort((a, b) => a.health - b.health);

  const getBarColor = (health) => {
    if (health < 25) return 'hsl(var(--health-critical))';
    if (health < 50) return 'hsl(var(--health-attention))';
    return 'hsl(var(--health-normal))';
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold mb-4">Comparativo da Frota (Saúde)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, opacity: 0.7 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, opacity: 0.7 }} tickFormatter={(val) => `${val}%`} />
          <Tooltip content={<ComparisonTooltip />} cursor={{fill: 'transparent'}} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Bar dataKey="health" name="Saúde (%)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.health)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;