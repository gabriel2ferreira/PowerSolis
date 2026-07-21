import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer } from 'lucide-react';

const TemperatureTrendChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('equipment_data_history')
          .select('report_date, temperature')
          .eq('equipment_id', equipmentId)
          .not('temperature', 'is', null)
          .order('report_date', { ascending: true });

        if (error) throw error;
        
        if (history && history.length > 0) {
          const formattedData = history.map(d => ({
            date: format(new Date(d.report_date), 'dd/MM/yyyy'),
            value: Number(d.temperature)
          }));
          
          setData(formattedData);
          
          const values = formattedData.map(d => d.value);
          setStats({
            min: Math.min(...values).toFixed(1),
            max: Math.max(...values).toFixed(1),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [equipmentId]);

  if (loading) return <Skeleton className="w-full h-[300px]" />;
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4"/> Temperatura</CardTitle></CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">Nenhum dado disponível</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-500" /> Temperatura (°C)
          </CardTitle>
          <div className="text-xs text-muted-foreground flex gap-3">
            <span>Min: {stats.min}</span>
            <span>Máx: {stats.max}</span>
            <span>Média: {stats.avg}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={12} tickMargin={10} />
              <YAxis fontSize={12} domain={['auto', 'auto']} />
              <Tooltip formatter={(value) => [`${value}°C`, 'Temperatura']} />
              <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureTrendChart;