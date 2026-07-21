import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateHealthMetrics } from '@/utils/calculateHealthMetrics';
import { useLifeExpectancyStandard } from '@/hooks/useLifeExpectancyStandard';
import { logger } from '@/lib/debugLogger';

const withTimeout = (promise, ms = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tempo de requisição esgotado (Timeout)')), ms)
    )
  ]);
};

export const useEquipmentHealthMonitoring = (intervalMs = 45000) => {
  const { standard } = useLifeExpectancyStandard();
  const isMonitoring = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const checkHealthAndManageAlerts = async () => {
      if (isMonitoring.current) return;
      isMonitoring.current = true;

      try {
        if (isMounted) setError(null);

        const [
          { data: equipments, error: eqError },
          { data: thermalData, error: thError },
          { data: activeAlerts, error: alError }
        ] = await withTimeout(Promise.all([
          supabase.from('equipments').select('id, name, equipment_api_config(*)'),
          supabase.from('equipment_thermal_data').select('equipment_id, hot_spot_temperature, ambient_temperature, timestamp').order('timestamp', { ascending: true }),
          supabase.from('alerts').select('id, equipment_id').eq('status', 'active').eq('alert_type', 'Equipamento em Nível Crítico')
        ]));

        if (eqError) {
          logger.error('useEquipmentHealthMonitoring', 'Error fetching equipments', eqError);
          throw eqError;
        }
        if (thError) {
          logger.error('useEquipmentHealthMonitoring', 'Error fetching thermal data', thError);
          throw thError;
        }
        if (alError) {
          logger.error('useEquipmentHealthMonitoring', 'Error fetching active alerts', alError);
          throw alError;
        }

        if (!isMounted) return;

        const activeAlertMap = new Map(activeAlerts.map(a => [a.equipment_id, a.id]));

        for (const eq of equipments) {
          if (!eq.equipment_api_config || eq.equipment_api_config.length === 0) {
             logger.warn('useEquipmentHealthMonitoring', `Missing API config for equipment ${eq.id}`);
          }

          const eqThermalData = thermalData.filter(t => t.equipment_id === eq.id);
          const metrics = calculateHealthMetrics(eqThermalData, eq, standard);
          
          const hasActiveAlert = activeAlertMap.has(eq.id);

          if (metrics.health < 25) {
            if (!hasActiveAlert) {
              await withTimeout(supabase.from('alerts').insert({
                equipment_id: eq.id,
                alert_type: 'Equipamento em Nível Crítico',
                status: 'active',
                message: `${eq.name} - Saúde: ${metrics.health.toFixed(1)}% - Ação imediata necessária`,
                health_percentage: metrics.health
              }));
            }
          } else {
            if (hasActiveAlert) {
              await withTimeout(supabase.from('alerts')
                .update({ 
                  status: 'resolved', 
                  resolved_at: new Date().toISOString() 
                })
                .eq('id', activeAlertMap.get(eq.id)));
            }
          }
        }
      } catch (err) {
        logger.error('useEquipmentHealthMonitoring', 'Background Monitoring Error', err);
        if (isMounted) setError(err.message || 'Falha no monitoramento em background');
      } finally {
        isMonitoring.current = false;
      }
    };

    checkHealthAndManageAlerts();
    intervalId = setInterval(checkHealthAndManageAlerts, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [standard, intervalMs]);

  return { error };
};