import React, { useMemo } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceArea, ReferenceDot, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LifeExpectancyDegradationChart = ({ equipment, historyData, expectedEndOfLifeDate }) => {
  
  const chartData = useMemo(() => {
    if (!equipment?.installation_date || !expectedEndOfLifeDate) return [];

    const installDate = new Date(equipment.installation_date);
    const eolDate = new Date(expectedEndOfLifeDate);
    const now = new Date();
    const totalDays = Math.max(1, differenceInDays(eolDate, installDate));
    const stepDays = Math.max(1, Math.floor(totalDays / 20)); // ~20 points on x-axis

    const result = [];
    
    // Sort actual history
    const sortedHistory = [...(historyData || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const getActualAtDate = (targetDate) => {
      // Find closest history point before or equal to targetDate
      let closest = null;
      for (const h of sortedHistory) {
        if (new Date(h.created_at) <= targetDate) closest = h;
        else break;
      }
      if (closest) return closest.other_metrics?.remaining_lifespan_percentage ?? closest.health_percentage ?? null;
      return null;
    };

    let lastActualHealth = 100;

    for (let i = 0; i <= totalDays; i += stepDays) {
      const pointDate = addDays(installDate, i);
      const isFuture = pointDate > now;
      
      let actual = null;
      let projected = null;

      if (!isFuture) {
        // Find actual data
        const histVal = getActualAtDate(pointDate);
        if (histVal !== null) {
          actual = Number(histVal);
          lastActualHealth = actual;
        } else {
          // Linear interpolation from 100% at install if no history yet
          const daysSinceInstall = differenceInDays(pointDate, installDate);
          actual = Math.max(0, 100 - (daysSinceInstall / totalDays) * 100);
          lastActualHealth = actual;
        }
      } else {
        // Projected linearly from last actual to 0 at EOL
        const daysFromNowToEOL = Math.max(1, differenceInDays(eolDate, now));
        const daysFromNowToPoint = differenceInDays(pointDate, now);
        const ratio = daysFromNowToPoint / daysFromNowToEOL;
        projected = Math.max(0, lastActualHealth - (lastActualHealth * ratio));
      }

      result.push({
        dateStr: format(pointDate, 'MM/yyyy'),
        fullDate: format(pointDate, 'dd/MM/yyyy'),
        timestamp: pointDate.getTime(),
        Actual: actual !== null ? Number(actual.toFixed(1)) : null,
        Projected: projected !== null ? Number(projected.toFixed(1)) : null,
        isCurrent: !isFuture && addDays(pointDate, stepDays) > now
      });
    }

    // Ensure EOL is exactly 0
    result.push({
      dateStr: format(eolDate, 'MM/yyyy'),
      fullDate: format(eolDate, 'dd/MM/yyyy'),
      timestamp: eolDate.getTime(),
      Actual: null,
      Projected: 0
    });

    return result;
  }, [equipment, historyData, expectedEndOfLifeDate]);

  if (!equipment?.installation_date) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>Degradação de Vida Útil (Linha do Tempo Completa)</CardTitle></CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Data de instalação não definida para este equipamento.
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 shadow-xl">
          <p className="font-semibold mb-2 text-slate-300">{data.fullDate}</p>
          {data.Actual !== null && (
            <p className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Real: {data.Actual}%</p>
          )}
          {data.Projected !== null && (
            <p className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Projetado: {data.Projected}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-200">Degradação de Vida Útil (Linha do Tempo Completa)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorDegradationFull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="25%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="75%" stopColor="#eab308" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="dateStr" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v) => `${v}%`} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              
              {/* Status Zones mapping to Asset Management (75/25) */}
              <ReferenceArea y1={75} y2={100} fill="#22c55e" fillOpacity={0.05} />
              <ReferenceArea y1={25} y2={75} fill="#eab308" fillOpacity={0.05} />
              <ReferenceArea y1={0} y2={25} fill="#ef4444" fillOpacity={0.05} />

              {/* Current Date Marker */}
              {chartData.find(d => d.isCurrent) && (
                <ReferenceDot 
                  x={chartData.find(d => d.isCurrent).dateStr} 
                  y={chartData.find(d => d.isCurrent).Actual || 0} 
                  r={5} 
                  fill="#fff" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                />
              )}

              <Line 
                name="Saúde Real"
                type="monotone" 
                dataKey="Actual" 
                stroke="url(#colorDegradationFull)" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                name="Projeção (fA atual)"
                type="monotone" 
                dataKey="Projected" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LifeExpectancyDegradationChart;