import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { formatTo2Decimals } from '@/utils/equipmentLifecycleUtils';

const AccelerationFactorGraph = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!equipmentId) return;
      setLoading(true);
      setError(null);
      try {
        const { data: history, error: fetchError } = await supabase
          .from('equipment_data_history')
          .select('acceleration_factor, report_date, created_at')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: true })
          .order('report_date', { ascending: true });

        if (fetchError) throw fetchError;

        const formattedData = (history || [])
          .filter(item => item.acceleration_factor !== null)
          .map(item => {
            const dateStr = item.report_date || item.created_at;
            return {
              date: format(new Date(dateStr), 'dd/MM/yyyy HH:mm'),
              fA: Number(item.acceleration_factor),
            };
          });

        setData(formattedData);
      } catch (err) {
        console.error("Error fetching fA data:", err);
        setError("Não foi possível carregar os dados do Fator de Aceleração.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [equipmentId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Fator de Aceleração (fA)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Fator de Aceleração (fA)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Evolução do Fator de Aceleração (fA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados suficientes para gerar o gráfico.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => formatTo2Decimals(val)} />
                <Tooltip 
                  formatter={(value) => [formatTo2Decimals(value), 'fA']}
                  labelStyle={{ color: '#000' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                
                {/* Reference Areas */}
                <ReferenceArea y1={0} y2={1.0} fill="#22c55e" fillOpacity={0.1} />
                <ReferenceArea y1={1.0} y2={1.5} fill="#eab308" fillOpacity={0.1} />
                <ReferenceArea y1={1.5} fill="#ef4444" fillOpacity={0.1} />

                {/* Reference Lines */}
                <ReferenceLine y={1.0} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Atenção (> 1.0)', fill: '#eab308', fontSize: 12 }} />
                <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Crítico (> 1.5)', fill: '#ef4444', fontSize: 12 }} />

                <Line 
                  type="monotone" 
                  dataKey="fA" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccelerationFactorGraph;