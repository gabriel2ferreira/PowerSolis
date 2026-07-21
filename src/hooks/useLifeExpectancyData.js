import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useLifeExpectancyData = (selectedEquipmentId) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [thermalData, setThermalData] = useState([]);
  const [allEquipmentHealth, setAllEquipmentHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEquipmentList = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, name, installation_date, lifespan_years, status')
        .order('name');
      
      if (error) throw error;
      setEquipmentList(data || []);
      
      // Simulate simple health logic for comparison chart
      const comparisonData = (data || []).map(eq => ({
        id: eq.id,
        name: eq.name,
        health: Math.floor(Math.random() * 40) + 60 // Simulated 60-100%
      }));
      setAllEquipmentHealth(comparisonData);
      
      return data;
    } catch (err) {
      console.error("Error fetching equipment list:", err);
      setError(err.message);
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedEquipmentId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch Equipment Details
      const { data: eq, error: eqError } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', selectedEquipmentId)
        .single();
        
      if (eqError) throw eqError;
      
      console.log("[Data Fetch] Equipment Details:", eq);
      setEquipmentDetails(eq);

      // Fetch Thermal Data
      const { data: thermal, error: thermError } = await supabase
        .from('equipment_thermal_data')
        .select('timestamp, hot_spot_temperature, equipment_id')
        .eq('equipment_id', selectedEquipmentId)
        .order('timestamp', { ascending: true })
        .limit(1000); // Safeguard
        
      if (thermError) throw thermError;
      
      console.log(`[Data Fetch] Thermal Data: ${thermal?.length} points`);
      setThermalData(thermal || []);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEquipmentId]);

  useEffect(() => {
    fetchEquipmentList();
  }, [fetchEquipmentList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    equipmentList,
    equipmentDetails,
    thermalData,
    allEquipmentHealth,
    loading,
    error,
    refetch: fetchData
  };
};