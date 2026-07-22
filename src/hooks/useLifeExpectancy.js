import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  calculateDaysSinceInstallation, 
  calculateEndOfLifeDate, 
  getHealthStatus 
} from '@/utils/calculateRemainingLife';
import { updateEquipmentHealthStatus } from '@/utils/updateEquipmentHealthStatus';
import { isValid } from 'date-fns';

export const useLifeExpectancy = (equipmentId) => {
  const [data, setData] = useState({
    equipment: null,
    installation_date: null,
    days_since_installation: null,
    remaining_life_days: null,
    remaining_life_years: null,
    health_percentage: null,
    end_of_life_date: null,
    status: null,
    historical_data: [],
    lifespan_years: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!equipmentId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: eq, error: eqError } = await supabase
        .from('equipments')
        .select(`
          id, 
          name, 
          equipment_type_id, 
          installation_date, 
          lifespan_years, 
          status,
          equipment_types (name)
        `)
        .eq('id', equipmentId)
        .single();

      if (eqError) throw eqError;

      const lifespanYears = eq.lifespan_years ? parseFloat(eq.lifespan_years) : 25;
      
      let installDate = null;
      if (eq.installation_date && isValid(new Date(eq.installation_date))) {
        installDate = new Date(eq.installation_date);
      }

      const isFutureInstall = installDate && installDate.getTime() > new Date().getTime();

      let daysSince = 0;
      let remainingDays = 0;
      let health = 0;
      let endOfLife = null;
      let eqStatus = 'Desconhecido';
      let historyData = [];

      if (installDate && !isFutureInstall) {
        daysSince = calculateDaysSinceInstallation(installDate);
        remainingDays = (lifespanYears * 365.25) - daysSince;
        health = Math.max(0, Math.min(100, (remainingDays / (lifespanYears * 365.25)) * 100));
        endOfLife = calculateEndOfLifeDate(installDate, lifespanYears);
        eqStatus = getHealthStatus(health).status;

        // Generate historical data points (monthly)
        const totalMonths = Math.floor(daysSince / 30.44);
        const startMillis = installDate.getTime();
        const interval = (new Date().getTime() - startMillis) / totalMonths;

        if (totalMonths > 0) {
          for (let i = 0; i <= totalMonths; i++) {
            const pointDate = new Date(startMillis + (interval * i));
            const pointDaysSince = (pointDate.getTime() - startMillis) / (1000 * 60 * 60 * 24);
            const pointRemaining = (lifespanYears * 365.25) - pointDaysSince;
            const pointHealth = Math.max(0, Math.min(100, (pointRemaining / (lifespanYears * 365.25)) * 100));
            
            historyData.push({
              date: pointDate,
              health_percentage: parseFloat(pointHealth.toFixed(2))
            });
          }
        } else {
          historyData.push({ date: installDate, health_percentage: 100 });
          historyData.push({ date: new Date(), health_percentage: parseFloat(health.toFixed(2)) });
        }

        // Generate future projection to end of life
        if (remainingDays > 0) {
           historyData.push({ date: endOfLife, health_percentage: 0 });
        }

        // Side effect: update status in DB
        updateEquipmentHealthStatus(equipmentId, health);
      }

      setData({
        equipment: { ...eq, typeName: eq.equipment_types?.name },
        installation_date: installDate,
        is_future_install: isFutureInstall,
        days_since_installation: Math.floor(daysSince),
        remaining_life_days: remainingDays,
        remaining_life_years: remainingDays > 0 ? (remainingDays / 365.25).toFixed(1) : 0,
        health_percentage: parseFloat(health.toFixed(2)),
        end_of_life_date: endOfLife,
        status: isFutureInstall ? 'Não Instalado' : eqStatus,
        historical_data: historyData,
        lifespan_years: lifespanYears,
      });

    } catch (err) {
      console.error("Error fetching life expectancy:", err);
      setError(err.message || "Failed to calculate life expectancy");
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, error, refetch: fetchData };
};