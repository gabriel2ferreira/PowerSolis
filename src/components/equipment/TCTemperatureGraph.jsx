import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { format } from 'date-fns';

const TCTemperatureGraph = ({ temperatureHistory }) => {
  const data = [...(temperatureHistory || [])].reverse().map(item => ({
    date: format(new Date(item.date), 'dd/MM'),
    fullDate: format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
    temperature: item.temperature
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Histórico de Temperatura</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado térmico disponível.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
              <Tooltip 
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                formatter={(value) => [`${value}°C`, 'Temperatura']}
              />
              
              <ReferenceArea y1={0} y2={55} fill="#22c55e" fillOpacity={0.1} />
              <ReferenceArea y1={55} y2={75} fill="#eab308" fillOpacity={0.1} />
              <ReferenceArea y1={75} y2={85} fill="#f97316" fillOpacity={0.1} />
              <ReferenceArea y1={85} fill="#ef4444" fillOpacity={0.1} />

              <ReferenceLine y={55} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Ref (55°C)', fill: '#22c55e', fontSize: 12 }} />
              <ReferenceLine y={75} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Aviso (75°C)', fill: '#eab308', fontSize: 12 }} />
              <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Crítico (85°C)', fill: '#ef4444', fontSize: 12 }} />

              <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TCTemperatureGraph;