import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceArea
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Gauge } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { formatTo2Decimals } from '@/utils/lifecycleCalculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateFormatted = format(new Date(data.date), 'dd MMM yyyy', { locale: ptBR });
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
        <p className="text-sm font-semibold capitalize mb-1">{dateFormatted}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          fA: <span className="font-bold text-foreground">{formatTo2Decimals(data.acceleration_factor)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const LifeExpectancyChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!equipmentId) return;
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('equipment_data_history')
          .select('created_at, acceleration_factor')
          .eq('equipment_id', equipmentId)
          .not('acceleration_factor', 'is', null)
          .order('created_at', { ascending: true });

        if (!error && history) {
          const formattedData = history.map(d => ({
            date: d.created_at,
            formattedDate: format(new Date(d.created_at), 'MM/yyyy'),
            acceleration_factor: d.acceleration_factor,
            time: new Date(d.created_at).getTime()
          }));
          setData(formattedData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [equipmentId]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          Evolução do Fator de Aceleração (fA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full chart-container">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sem dados de Fator de Aceleração para exibir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <ReferenceArea y1={0} y2={1.0} fill="#22c55e" fillOpacity={0.1} />
                <ReferenceArea y1={1.0} y2={1.5} fill="#eab308" fillOpacity={0.1} />
                <ReferenceArea y1={1.5} y2={10} fill="#ef4444" fillOpacity={0.1} />
                
                <XAxis dataKey="formattedDate" tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} tickMargin={10} minTickGap={30} />
                <YAxis domain={[0, 'dataMax + 0.5']} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine y={1.0} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Atenção (> 1.0)', fill: 'currentColor', fontSize: 11 }} />
                <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Crítico (> 1.5)', fill: 'currentColor', fontSize: 11 }} />

                <Line name="Fator (fA)" type="monotone" dataKey="acceleration_factor" stroke="currentColor" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex gap-4 justify-center mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#22c55e] rounded-full opacity-50"></div> Bom (&lt; 1.0)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#eab308] rounded-full opacity-50"></div> Atenção (1.0 - 1.5)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ef4444] rounded-full opacity-50"></div> Crítico (&gt; 1.5)</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LifeExpectancyChart;