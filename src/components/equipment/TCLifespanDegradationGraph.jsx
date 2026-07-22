import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { format, addYears, differenceInDays } from 'date-fns';

const TCLifespanDegradationGraph = ({ installationDate, data: calcData }) => {
  const chartData = useMemo(() => {
    if (!installationDate || !calcData) return [];
    
    const start = new Date(installationDate);
    const timeEnd = new Date(start.getTime() + (25 * 365.25 * 24 * 3600 * 1000));
    const now = new Date();
    
    const result = [];
    // Generate 10 points between install and latest end date
    const totalDays = differenceInDays(calcData.closestEndDate, start);
    const step = Math.max(1, Math.floor(totalDays / 10));
    
    for (let i = 0; i <= 10; i++) {
      const currentPointDate = new Date(start.getTime() + (i * step * 24 * 3600 * 1000));
      
      const timeElapsedDays = differenceInDays(currentPointDate, start);
      const timeRemaining = Math.max(0, 100 - (timeElapsedDays * (100 / (25 * 365.25))));
      
      let actualRemaining = null;
      if (currentPointDate <= now) {
        // Interpolate actual past
        const ratio = timeElapsedDays / Math.max(1, differenceInDays(now, start));
        actualRemaining = Math.max(0, 100 - (ratio * (100 - calcData.remainingPercentage)));
      } else if (currentPointDate <= calcData.closestEndDate) {
        // Interpolate actual future
        const totalFuture = differenceInDays(calcData.closestEndDate, now);
        const elapsedFuture = differenceInDays(currentPointDate, now);
        const ratio = elapsedFuture / Math.max(1, totalFuture);
        actualRemaining = Math.max(0, calcData.remainingPercentage - (ratio * calcData.remainingPercentage));
      }
      
      result.push({
        date: format(currentPointDate, 'dd/MM/yy'),
        timestamp: currentPointDate.getTime(),
        timeBased: Number(timeRemaining.toFixed(2)),
        actual: actualRemaining !== null ? Number(actualRemaining.toFixed(2)) : null,
      });
    }
    return result;
  }, [installationDate, calcData]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Degradação da Vida Útil</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Dados insuficientes.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={[0, 100]} tick={{fontSize: 12}} tickFormatter={val => `${val}%`} />
              <Tooltip formatter={(value, name) => [`${value}%`, name === 'timeBased' ? 'Teórico' : 'Real']} />
              
              <Line type="monotone" dataKey="timeBased" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} dot={false} name="timeBased" />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 6 }} name="actual" />
              
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TCLifespanDegradationGraph;