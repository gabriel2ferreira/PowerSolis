import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getEquipmentHealthHistory } from '@/services/equipmentHealthSync';
import { Loader2 } from 'lucide-react';

const HealthHistoryChart = ({ equipmentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const history = await getEquipmentHealthHistory(equipmentId);
      const chartData = history.map(item => ({
        ...item,
        formattedDate: format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm')
      })).reverse();
      setData(chartData);
      setLoading(false);
    };
    if (equipmentId) fetchData();
  }, [equipmentId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (data.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">Sem dados de histórico de saúde.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Saúde do Equipamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="formattedDate" className="text-xs" />
              <YAxis yAxisId="left" domain={[0, 100]} className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" name="Saúde Final (%)" dataKey="saude_percent_final" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" name="Saúde Tempo (%)" dataKey="saude_percent_tempo" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              <Line yAxisId="left" type="monotone" name="Saúde FAA (%)" dataKey="saude_percent_faa" stroke="#eab308" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              <Line yAxisId="right" type="monotone" name="Fator de Aceleração" dataKey="fator_aceleracao" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthHistoryChart;