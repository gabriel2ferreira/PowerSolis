import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Thermometer, AlertTriangle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const TemperatureMonitoringPanel = ({ currentTemp, historyData }) => {
  const isCritical = currentTemp > 130;
  const isWarning = currentTemp >= 110 && currentTemp <= 130;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="w-5 h-5" />
          Monitoramento Térmico em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-xl">
          <div>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Temperatura Hot-Spot Atual</p>
            <p className={`text-5xl font-black mt-2 ${isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-green-500'}`}>
              {currentTemp?.toFixed(1) || '--'} °C
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500" /> Crítico (&gt;130°C)
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-500" /> Alerta (110-130°C)
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Normal (&lt;110°C)
            </div>
          </div>
        </div>

        {isCritical && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Temperatura Crítica!</AlertTitle>
            <AlertDescription>
              O equipamento excedeu o limite de segurança de 130°C. Degradação acelerada em andamento.
            </AlertDescription>
          </Alert>
        )}

        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" tick={{fontSize: 12}} />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <ReferenceLine y={130} stroke="red" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Limite Crítico' }} />
              <ReferenceLine y={110} stroke="orange" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Atenção' }} />
              <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureMonitoringPanel;