import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook for managing equipment metrics and API configuration
 */
export const useEquipmentMetrics = () => {
  /**
   * Fetch latest metrics for an equipment
   * @param {string} equipmentId - Equipment UUID
   * @returns {Promise<Array>} Array of metrics
   */
  const fetchLatestMetrics = useCallback(async (equipmentId) => {
    try {
      const { data, error } = await supabase
        .from('equipment_metrics')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
      return [];
    }
  }, []);

  /**
   * Fetch metrics by type for an equipment
   * @param {string} equipmentId - Equipment UUID
   * @param {string} metricType - Type of metric to fetch
   * @returns {Promise<Array>} Array of metrics
   */
  const fetchMetricsByType = useCallback(async (equipmentId, metricType) => {
    try {
      const { data, error } = await supabase
        .from('equipment_metrics')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('metric_type', metricType)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${metricType} metrics:`, error);
      return [];
    }
  }, []);

  /**
   * Fetch API configuration for an equipment
   * @param {string} equipmentId - Equipment UUID
   * @returns {Promise<object|null>} Configuration object or null
   */
  const fetchEquipmentApiConfig = useCallback(async (equipmentId) => {
    try {
      const { data, error } = await supabase
        .from('equipment_api_config')
        .select('*')
        .eq('equipment_id', equipmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config found
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching equipment API config:', error);
      return null;
    }
  }, []);

  /**
   * Update equipment API configuration
   * @param {string} equipmentId - Equipment UUID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|null>} Updated configuration or null
   */
  const updateEquipmentApiConfig = useCallback(async (equipmentId, updates) => {
    try {
      // Check if config exists
      const existing = await fetchEquipmentApiConfig(equipmentId);

      let result;
      if (existing) {
        // Update existing config
        const { data, error } = await supabase
          .from('equipment_api_config')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('equipment_id', equipmentId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new config
        const { data, error } = await supabase
          .from('equipment_api_config')
          .insert({ equipment_id: equipmentId, ...updates })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error updating equipment API config:', error);
      return null;
    }
  }, [fetchEquipmentApiConfig]);

  return {
    fetchLatestMetrics,
    fetchMetricsByType,
    fetchEquipmentApiConfig,
    updateEquipmentApiConfig
  };
};