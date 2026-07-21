import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  calculateIEEEEquivalentAgingFactor, 
  calculateIEEELossOfLife, 
  calculateIEEEHealthPercentage 
} from '@/utils/lifeExpectancyCalculations';
import { 
  calculateIECLossOfLife, 
  calculateIECHealthPercentage 
} from '@/utils/iecCalculations';
import { getInsulationLifeHours, getInsulationLifeDays, getDefaultAgingFactor } from '@/utils/equipmentInsulationConfig';

export const useLifeExpectancyCalculations = (equipmentId, standard = 'IEEE') => {
  const [data, setData] = useState({
    currentHealth: 100,
    currentLOL: 0,
    averageTemp: 0,
    peakTemp: 0,
    minTemp: 0,
    lastReadingDate: null,
    standard: standard
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!equipmentId) return;
    setIsLoading(true);
    
    try {
      // Fetch Equipment details
      const { data: eq, error: eqError } = await supabase
        .from('equipments')
        .select(`id, equipment_types(name)`)
        .eq('id', equipmentId)
        .single();
      
      if (eqError) throw eqError;
      const equipmentType = eq.equipment_types?.name;

      // Fetch Thermal Data
      const { data: thermalData, error: thermalError } = await supabase
        .from('equipment_thermal_data')
        .select('timestamp, hot_spot_temperature')
        .eq('equipment_id', equipmentId)
        .order('timestamp', { ascending: true });

      if (thermalError) throw thermalError;

      const hasData = thermalData && thermalData.length > 0;
      let currentHealth = 100;
      let currentLOL = 0;
      let avgTemp = 0;
      let peakTemp = 0;
      let minTemp = 0;
      let lastDate = null;

      if (hasData) {
        const temps = thermalData.map(d => parseFloat(d.hot_spot_temperature));
        avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        peakTemp = Math.max(...temps);
        minTemp = Math.min(...temps);
        lastDate = new Date(thermalData[thermalData.length - 1].timestamp);

        if (standard === 'IEEE') {
          const readings = thermalData.map(d => ({ temperature: parseFloat(d.hot_spot_temperature), timeStep: 1 })); // Assuming 1h steps for simplicity
          const feqa = calculateIEEEEquivalentAgingFactor(readings);
          const lolHours = calculateIEEELossOfLife(feqa, getDefaultAgingFactor(), getInsulationLifeHours(equipmentType));
          currentLOL = lolHours;
          currentHealth = calculateIEEEHealthPercentage(currentLOL);
        } else {
          const readings = thermalData.map(d => ({ temperature: parseFloat(d.hot_spot_temperature), timeInterval: 1/24 })); // Assuming 1h steps = 1/24 days
          const cumulativeLOL = calculateIECLossOfLife(readings, 0);
          currentLOL = (cumulativeLOL / getInsulationLifeDays(equipmentType)) * 100;
          currentHealth = calculateIECHealthPercentage(cumulativeLOL, getInsulationLifeDays(equipmentType));
        }
      }

      setData({
        currentHealth,
        currentLOL,
        averageTemp: avgTemp,
        peakTemp,
        minTemp,
        lastReadingDate: lastDate,
        standard
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching life expectancy calc:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId, standard]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, isLoading, error };
};