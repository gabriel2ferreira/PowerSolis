import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const EquipmentHealthChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!equipmentId) return;
      setLoading(true);
      try {
        const { data: historyData, error: historyError } = await supabase
          .from('equipment_data_history')
          .select('health_percentage, created_at')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: true });

        if (historyError) throw historyError;

        const formattedData = (historyData || []).map(item => ({
          date: format(new Date(item.created_at), 'dd/MM/yyyy'),
          rawDate: new Date(item.created_at).getTime(),
          health: item.health_percentage != null ? Number(item.health_percentage) : null
        })).filter(item => item.health !== null);

        setData(formattedData);
      } catch (err) {
        console.error("Error fetching health history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [equipmentId]);

  if (loading) return <Skeleton className="w-full h-[350px] rounded-xl" />;
  if (error) return <div className="text-destructive flex items-center gap-2 p-4 border rounded-md"><AlertCircle className="w-4 h-4"/> Erro: {error}</div>;
  if (data.length === 0) return <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">Nenhum dado de histórico de saúde disponível.</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Saúde</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                formatter={(value) => [`${value}%`, 'Saúde']}
              />
              <ReferenceArea y1={0} y2={25} fill="hsl(var(--status-critical))" fillOpacity={0.1} />
              <ReferenceArea y1={25} y2={50} fill="hsl(var(--status-warning))" fillOpacity={0.1} />
              <ReferenceArea y1={50} y2={100} fill="hsl(var(--status-normal))" fillOpacity={0.1} />
              <Line 
                type="monotone" 
                dataKey="health" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentHealthChart;