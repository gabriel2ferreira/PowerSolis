import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateTCRemainingLifespan } from '@/utils/tcLifespanCalculations';

export const useTCLifespanCalculations = (equipmentId, installationDate) => {
  const [data, setData] = useState(null);
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!equipmentId) return;
      setLoading(true);
      setError(null);
      
      try {
        // Fetch last 365 days of history
        const { data: history, error: fetchError } = await supabase
          .from('equipment_data_history')
          .select('temperature, created_at')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: false })
          .limit(365);

        if (fetchError) throw fetchError;

        const formattedHistory = (history || []).map(h => ({
          date: h.created_at,
          temperature: h.temperature
        })).filter(h => h.temperature !== null && h.temperature !== undefined);

        if (isMounted) {
          setTemperatureHistory(formattedHistory);
          const calculations = calculateTCRemainingLifespan(installationDate, formattedHistory);
          setData(calculations);
        }

      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [equipmentId, installationDate]);

  return { loading, error, data, temperatureHistory };
};