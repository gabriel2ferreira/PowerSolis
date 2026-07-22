import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateEquipmentHealth } from '@/utils/healthCalculation';

export const useEquipmentStats = (autoRefreshInterval = 30000) => {
  const [stats, setStats] = useState({
    totalEquipments: 0,
    healthyCount: 0,
    attentionCount: 0,
    criticalCount: 0,
    averageHealth: 0,
    equipments: [],
    
    // Legacy support for older components
    totalItems: 0,
    locations: [],
    distribution: [],
    statusCounts: {
      critical: 0,
      warning: 0,
      normal: 0,
      new: 0,
    },
    alerts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
        .from('equipments')
        .select(`
          id,
          name,
          equipment_type_id,
          city,
          state,
          latitude,
          longitude,
          voltage_level,
          location_name,
          status,
          equipment_types (
            id,
            name
          ),
          equipment_api_config (
            id,
            horas_operacao,
            ponto_quente_externo,
            temperatura_ambiente,
            vida_util_isolamento_h,
            estrategia_envelhecimento,
            tangente_perdas,
            corrente_primario,
            temp_ref,
            vida_ref_anos,
            p
          )
        `);

      if (fetchError) {
        console.error('Error fetching equipments from Supabase:', fetchError);
        throw new Error(`Falha ao buscar equipamentos: ${fetchError.message}`);
      }

      if (!isMounted.current) return;

      if (!data || data.length === 0) {
        setStats({
          totalEquipments: 0,
          healthyCount: 0,
          attentionCount: 0,
          criticalCount: 0,
          averageHealth: 0,
          equipments: [],
          totalItems: 0,
          locations: [],
          distribution: [],
          statusCounts: { critical: 0, warning: 0, normal: 0, new: 0 },
          alerts: []
        });
        return;
      }

      let healthy = 0;
      let attention = 0;
      let critical = 0;
      let totalHealthScore = 0;

      const processedEquipments = data.map(eq => {
        const apiConfig = Array.isArray(eq.equipment_api_config) 
          ? eq.equipment_api_config[0] 
          : eq.equipment_api_config;

        const eqForCalc = { ...eq, api_config: apiConfig };
        
        let healthData;
        try {
          healthData = calculateEquipmentHealth(eqForCalc);
        } catch (calcError) {
          console.error(`Error calculating health for equipment ID ${eq.id}:`, calcError);
          healthData = {
            score: 0,
            percentage: 0,
            status: 'Crítico',
            color: '#ef4444',
            vidaRemanescenteAnos: 0,
            fatorAceleracao: 1
          };
        }

        if (healthData.status === 'Bom') {
          healthy++;
        } else if (healthData.status === 'Atenção') {
          attention++;
        } else {
          critical++;
        }

        totalHealthScore += healthData.percentage;

        return {
          ...eq,
          health: healthData,
          vida_util: healthData.percentage // Legacy field map
        };
      });

      const averageHealth = processedEquipments.length > 0 
        ? totalHealthScore / processedEquipments.length 
        : 0;

      // Calculate distribution for legacy support
      const distributionMap = {};
      processedEquipments.forEach(eq => {
        const typeName = eq.equipment_types?.name || 'Desconhecido';
        distributionMap[typeName] = (distributionMap[typeName] || 0) + 1;
      });
      
      const distribution = Object.entries(distributionMap).map(([name, count]) => ({
        equipment_type: name,
        count,
        percentage: ((count / processedEquipments.length) * 100).toFixed(1)
      }));

      // Generate alerts based on critical status
      const alerts = processedEquipments
        .filter(eq => eq.health.status === 'Crítico' || eq.health.percentage <= 5)
        .map(eq => ({
          id: eq.id,
          name: eq.name,
          status: 'Crítico',
          vida_util: eq.health.percentage.toFixed(1),
          action: 'Revisão ou substituição recomendada'
        }))
        .slice(0, 5);

      if (isMounted.current) {
        setStats({
          totalEquipments: processedEquipments.length,
          healthyCount: healthy,
          attentionCount: attention,
          criticalCount: critical,
          averageHealth,
          equipments: processedEquipments,
          
          // Legacy properties
          totalItems: processedEquipments.length,
          locations: processedEquipments,
          distribution,
          statusCounts: { 
            critical, 
            warning: attention, 
            normal: healthy, 
            new: 0 
          },
          alerts
        });
      }

    } catch (err) {
      console.error('Error in useEquipmentStats fetch process:', err);
      if (isMounted.current) {
        setError(err.message || 'Falha ao processar estatísticas de equipamentos');
      }
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
    let interval;
    if (autoRefreshInterval > 0) {
      interval = setInterval(fetchStats, autoRefreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStats, autoRefreshInterval]);

  return { 
    ...stats, 
    loading, 
    error, 
    refetch: fetchStats 
  };
};