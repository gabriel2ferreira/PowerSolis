import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateHealthMetrics } from '@/utils/calculateHealthMetrics';
import { useLifeExpectancyStandard } from '@/hooks/useLifeExpectancyStandard';
import { logger } from '@/lib/debugLogger';

export const useEquipmentHealthStatus = (pollingIntervalMs = 45000) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { standard } = useLifeExpectancyStandard();
  
  const [equipmentStatus, setEquipmentStatus] = useState({
    critical: [],
    attention: [],
    healthy: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: equipments, error: eqError } = await supabase
        .from('equipments')
        .select('*, equipment_types(name), equipment_api_config(*)');

      if (eqError) {
        logger.error('useEquipmentHealthStatus', 'Error fetching equipments', eqError);
        throw eqError;
      }

      const { data: thermalData, error: thError } = await supabase
        .from('equipment_thermal_data')
        .select('*')
        .order('timestamp', { ascending: true });

      if (thError) {
        logger.error('useEquipmentHealthStatus', 'Error fetching thermal data', thError);
        throw thError;
      }

      const critical = [];
      const attention = [];
      const healthy = [];

      for (const eq of equipments) {
        if (!eq.equipment_api_config || eq.equipment_api_config.length === 0) {
           logger.warn('useEquipmentHealthStatus', `Missing API config for equipment ${eq.id}`);
        }

        const eqThermalData = thermalData.filter(t => t.equipment_id === eq.id);
        const metrics = calculateHealthMetrics(eqThermalData, eq, standard);
        
        const eqWithMetrics = {
          ...eq,
          type_name: eq.equipment_types?.name || 'Desconhecido',
          health: metrics.health,
          status: metrics.status,
          lastTemperature: metrics.lastTemperature,
          lastUpdate: metrics.lastTemperatureTimestamp || eq.updated_at || eq.created_at
        };

        if (metrics.health < 25) {
          critical.push(eqWithMetrics);
        } else if (metrics.health < 50) {
          attention.push(eqWithMetrics);
        } else {
          healthy.push(eqWithMetrics);
        }
      }

      setEquipmentStatus({
        critical: critical.sort((a, b) => a.health - b.health),
        attention: attention.sort((a, b) => a.health - b.health),
        healthy
      });

    } catch (err) {
      logger.error('useEquipmentHealthStatus', 'Error fetching equipment health status', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (pollingIntervalMs) {
      const intervalId = setInterval(fetchData, pollingIntervalMs);
      return () => clearInterval(intervalId);
    }
  }, [standard, pollingIntervalMs]);

  return { ...equipmentStatus, loading, error, refetch: fetchData };
};