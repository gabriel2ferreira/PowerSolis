import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import { differenceInMonths } from 'date-fns';

const LifeExpectancyPrediction = ({ equipmentId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculatePrediction = async () => {
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('equipment_data_history')
          .select('report_date, health_percentage')
          .eq('equipment_id', equipmentId)
          .not('health_percentage', 'is', null)
          .order('report_date', { ascending: true });

        if (error) throw error;

        if (!history || history.length < 3) {
          setPrediction({ insufficient: true, points: history ? history.length : 0 });
          setLoading(false);
          return;
        }

        const first = history[0];
        const last = history[history.length - 1];
        const monthsDiff = differenceInMonths(new Date(last.report_date), new Date(first.report_date));
        
        const healthDiff = Number(first.health_percentage) - Number(last.health_percentage);
        
        let trend = 'stable';
        let remainingMonths = 0;
        let confidence = Math.min((history.length * 10) + 40, 95); // Heuristic confidence

        if (monthsDiff > 0 && healthDiff > 1) {
          trend = 'decreasing';
          const declineRatePerMonth = healthDiff / monthsDiff;
          remainingMonths = Math.round(Number(last.health_percentage) / declineRatePerMonth);
        } else if (healthDiff < -1) {
          trend = 'increasing';
          remainingMonths = 999; // Represents improving/renewed
        } else {
          trend = 'stable';
          remainingMonths = Math.round(Number(last.health_percentage) / 0.5); // Assume slow natural 0.5% per month if totally stable
        }

        setPrediction({
          insufficient: false,
          trend,
          remainingMonths,
          confidence,
          points: history.length
        });
      } catch (err) {
        console.error('Error calculating life expectancy prediction:', err);
      } finally {
        setLoading(false);
      }
    };

    calculatePrediction();
  }, [equipmentId]);

  if (loading) return <Skeleton className="w-full h-40" />;

  if (prediction?.insufficient) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <p>Dados insuficientes para previsão.</p>
          <p className="text-sm">São necessários pelo menos 3 pontos de dados históricos. (Atuais: {prediction.points})</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Previsão de Vida Útil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Vida Útil Estimada</span>
            {prediction.trend === 'increasing' ? (
              <span className="text-3xl font-bold text-green-600">Tendência de Melhora</span>
            ) : (
              <span className="text-3xl font-bold text-foreground">{prediction.remainingMonths} meses</span>
            )}
          </div>
          
          <div className="flex-1 flex justify-end">
            {prediction.trend === 'decreasing' && <TrendingDown className="w-10 h-10 text-red-500 opacity-80" />}
            {prediction.trend === 'increasing' && <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />}
            {prediction.trend === 'stable' && <Minus className="w-10 h-10 text-yellow-500 opacity-80" />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Confiança</p>
            <p className="font-semibold">{prediction.confidence}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Baseado em</p>
            <p className="font-semibold">{prediction.points} pontos de dados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LifeExpectancyPrediction;