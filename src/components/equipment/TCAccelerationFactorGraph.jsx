import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { calculateAccelerationFactor } from '@/utils/tcLifespanCalculations';

const TCAccelerationFactorGraph = ({ temperatureHistory }) => {
  const data = [...(temperatureHistory || [])].reverse().map(item => ({
    date: format(new Date(item.date), 'dd/MM'),
    fullDate: format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
    fa: calculateAccelerationFactor(item.temperature)
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Fator de Aceleração (fA)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado térmico disponível.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={[0, 'auto']} tick={{fontSize: 12}} />
              <Tooltip 
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                formatter={(value) => [value.toFixed(2), 'fA']}
              />
              
              <ReferenceArea y1={0} y2={1.0} fill="#22c55e" fillOpacity={0.1} />
              <ReferenceArea y1={1.0} y2={1.5} fill="#eab308" fillOpacity={0.1} />
              <ReferenceArea y1={1.5} y2={2.5} fill="#f97316" fillOpacity={0.1} />
              <ReferenceArea y1={2.5} fill="#ef4444" fillOpacity={0.1} />

              <ReferenceLine y={1.0} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Normal (1.0)', fill: '#22c55e', fontSize: 12 }} />
              <ReferenceLine y={1.5} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Atenção (1.5)', fill: '#eab308', fontSize: 12 }} />
              <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Crítico (2.5)', fill: '#ef4444', fontSize: 12 }} />

              <Line type="monotone" dataKey="fa" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TCAccelerationFactorGraph;