import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceArea, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';
import { AlertCircle } from 'lucide-react';

const LifespanDegradationChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDegradationData = async () => {
      if (!equipmentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: historyData, error: fetchError } = await supabase
          .from('equipment_data_history')
          .select('*')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        const formattedData = historyData.map(record => {
          // Fallback to health_percentage if remaining_lifespan_percentage is not explicitly available
          const rawPercentage = record.other_metrics?.remaining_lifespan_percentage 
                             ?? record.health_percentage 
                             ?? 0;
          
          const percentage = Number(rawPercentage);
          let status = 'Crítico';
          if (percentage > 75) status = 'Bom';
          else if (percentage >= 25) status = 'Atenção';

          return {
            date: record.created_at ? format(new Date(record.created_at), 'dd/MM/yyyy') : '',
            rawDate: record.created_at,
            percentage: Math.min(Math.max(percentage, 0), 100), // clamp 0-100
            status
          };
        }).filter(item => item.date);

        setData(formattedData);
      } catch (err) {
        console.error("Error fetching degradation data:", err);
        setError("Não foi possível carregar os dados de degradação.");
      } finally {
        setLoading(false);
      }
    };

    fetchDegradationData();
  }, [equipmentId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-muted-foreground flex items-center justify-between gap-4">
            <span>Vida Útil Restante:</span>
            <span className="font-medium text-foreground">{dataPoint.percentage.toFixed(1)}%</span>
          </p>
          <p className="text-muted-foreground flex items-center justify-between gap-4">
            <span>Status:</span>
            <span className={`font-medium ${
              dataPoint.status === 'Bom' ? 'text-green-500' : 
              dataPoint.status === 'Atenção' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {dataPoint.status}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <div className="flex justify-center gap-6 mt-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
        <span>Bom (&gt;75%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
        <span>Atenção (25%-75%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
        <span>Crítico (&lt;25%)</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Degradação de Vida Útil</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Degradação de Vida Útil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Degradação de Vida Útil</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados suficientes para exibir o gráfico.
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorDegradation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="25%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="75%" stopColor="#eab308" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10}
                  stroke="currentColor" 
                  opacity={0.5}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 12 }}
                  stroke="currentColor" 
                  opacity={0.5}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceArea y1={75} y2={100} fill="#22c55e" fillOpacity={0.05} />
                <ReferenceArea y1={25} y2={75} fill="#eab308" fillOpacity={0.05} />
                <ReferenceArea y1={0} y2={25} fill="#ef4444" fillOpacity={0.05} />

                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="url(#colorDegradation)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
            {renderLegend()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LifespanDegradationChart;