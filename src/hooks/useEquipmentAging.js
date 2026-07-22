import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useEquipmentAging = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEquipmentList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('equipments')
        .select(`
          id,
          name,
          equipment_api_config (
            temp_ref,
            tangente_perdas,
            corrente_primario,
            temperatura_ambiente,
            horas_operacao
          )
        `);

      if (fetchError) throw fetchError;

      // Map to the requested schema
      const mappedData = (data || []).map(eq => {
        const config = Array.isArray(eq.equipment_api_config) 
          ? eq.equipment_api_config[0] 
          : eq.equipment_api_config;

        return {
          id: eq.id,
          name: eq.name,
          hotspot_temperature: config?.temp_ref || 85,
          loss_tangent: config?.tangente_perdas || 0.5,
          primary_current: config?.corrente_primario || 1000,
          ambient_temperature: config?.temperatura_ambiente || 30,
          external_point_temperature: config?.temp_ref ? config.temp_ref - 10 : 75,
          total_operating_hours: config?.horas_operacao || 0,
          installation_date: eq.created_at,
          // Base mock values to be updated by calculations
          life_loss_percentage: 0,
          remaining_useful_life_years: 25 
        };
      });

      return mappedData;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getEquipmentAgingHistory = useCallback(async (equipment_id) => {
    try {
      setLoading(true);
      
      // Simulate fetching from equipment_aging_history if it doesn't exist natively yet
      const { data, error: fetchError } = await supabase
        .from('equipment_metrics')
        .select('*')
        .eq('equipment_id', equipment_id)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;

      // Map metrics to history format
      return (data || []).map(metric => ({
        equipment_id: metric.equipment_id,
        measurement_date: metric.timestamp,
        hotspot_temperature: metric.api_response?.hotspot || 85,
        ambient_temperature: metric.api_response?.ambient || 30,
        operating_hours: metric.api_response?.hours || 1000,
        life_loss_percentage: metric.metric_value || 0,
        remaining_useful_life_years: 25 - (metric.metric_value || 0) * 0.25,
        failure_probability: 5
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateCurrentRemainingLife = useCallback(async (equipment_id) => {
    // Convenience wrapper that could fetch specific DB fields and compute immediately
    return {
      remaining_useful_life_years: 25,
      life_loss_percentage: 0
    };
  }, []);

  return {
    loading,
    error,
    getEquipmentList,
    getEquipmentAgingHistory,
    calculateCurrentRemainingLife
  };
};