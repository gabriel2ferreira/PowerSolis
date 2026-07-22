import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker } from 'lucide-react';

const OilConditionTrendChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to map text conditions to scores
  const mapConditionToScore = (condition) => {
    if (!condition) return null;
    const lower = condition.toLowerCase();
    if (lower.includes('good') || lower.includes('bom') || lower.includes('excelente') || lower.includes('excellent')) return 100;
    if (lower.includes('fair') || lower.includes('regular') || lower.includes('aceitável')) return 75;
    if (lower.includes('poor') || lower.includes('ruim') || lower.includes('baixo')) return 25;
    if (lower.includes('critical') || lower.includes('crítico')) return 0;
    
    const num = parseFloat(condition);
    if (!isNaN(num)) return num;
    
    return 50; // default unknown score
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('equipment_data_history')
          .select('report_date, oil_condition')
          .eq('equipment_id', equipmentId)
          .not('oil_condition', 'is', null)
          .order('report_date', { ascending: true });

        if (error) throw error;
        
        if (history && history.length > 0) {
          const formattedData = history
            .map(d => ({
              date: format(new Date(d.report_date), 'dd/MM/yyyy'),
              rawCondition: d.oil_condition,
              value: mapConditionToScore(d.oil_condition)
            }))
            .filter(d => d.value !== null);
          
          setData(formattedData);
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
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Beaker className="w-4 h-4"/> Condição do Óleo</CardTitle></CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">Nenhum dado disponível (ou valores não interpretáveis)</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Beaker className="w-4 h-4 text-amber-500" /> Condição do Óleo (Score Estimado)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={12} tickMargin={10} />
              <YAxis fontSize={12} domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name, props) => [`Score: ${value} (${props.payload.rawCondition})`, 'Condição do Óleo']} 
              />
              <Line type="stepAfter" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default OilConditionTrendChart;