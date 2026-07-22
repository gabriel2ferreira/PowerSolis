import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  calculateIEEEEquivalentAgingFactor, 
  calculateIEEELossOfLife, 
  calculateIEEEHealthPercentage 
} from '@/utils/lifeExpectancyCalculations';
import { getInsulationLifeHours } from '@/utils/equipmentInsulationConfig';

export const useDegradationCurve = (equipmentId, startDate, endDate, standard = 'IEEE') => {
  const [curveData, setCurveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurve = useCallback(async () => {
    if (!equipmentId) return;
    setIsLoading(true);

    try {
      const { data: thermalData, error: thermalError } = await supabase
        .from('equipment_thermal_data')
        .select('timestamp, hot_spot_temperature')
        .eq('equipment_id', equipmentId)
        .order('timestamp', { ascending: true });

      if (thermalError) throw thermalError;

      // Group by Day and Calculate Incremental Degradation
      // For simplicity in this environment, we'll build a simple simulated/aggregated curve 
      // based on actual data bounds
      let results = [];
      let cumulativeFeQa = 0;
      let count = 0;

      if (thermalData && thermalData.length > 0) {
        thermalData.forEach((d) => {
          const temp = parseFloat(d.hot_spot_temperature);
          const feqa = calculateIEEEEquivalentAgingFactor([{ temperature: temp, timeStep: 1 }]);
          cumulativeFeQa += feqa;
          count++;
          
          if (count % 24 === 0) { // Daily aggregate approx
            const avgFeqa = cumulativeFeQa / count;
            const lol = calculateIEEELossOfLife(avgFeqa, 1, 150000) * count; // Simplified accumulation
            results.push({
              date: new Date(d.timestamp).toISOString(),
              temperature: temp,
              LOL: lol,
              health: Math.max(0, 100 - lol)
            });
          }
        });
      } else {
        // Fallback for empty DB - simulate a straight line at 100%
        results = [{
          date: new Date().toISOString(),
          temperature: 0,
          LOL: 0,
          health: 100
        }];
      }

      setCurveData(results);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId, startDate, endDate, standard]);

  useEffect(() => {
    fetchCurve();
  }, [fetchCurve]);

  return { historicalCurve: curveData, currentDate: new Date(), isLoading, error };
};