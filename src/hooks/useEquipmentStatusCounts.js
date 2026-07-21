import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useEquipmentStatusCounts() {
  const [data, setData] = useState({
    totalCount: 0,
    atencaoCount: 0,
    criticoCount: 0,
    atencaoPercentage: 0,
    criticoPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: equipments, error: eqError } = await supabase
        .from('equipments')
        .select(`
          id, 
          installation_date, 
          equipment_lifespan, 
          last_health_percentage,
          equipment_data_history (
            health_percentage,
            report_date
          )
        `);

      if (eqError) throw eqError;

      let total = 0;
      let atencao = 0;
      let critico = 0;

      equipments.forEach((eq) => {
        total++;
        let health = null;

        // 1. Try to get latest from history
        if (eq.equipment_data_history && eq.equipment_data_history.length > 0) {
          // Sort by report_date descending
          const sortedHistory = [...eq.equipment_data_history].sort(
            (a, b) => new Date(b.report_date) - new Date(a.report_date)
          );
          if (sortedHistory[0].health_percentage !== null) {
            health = parseFloat(sortedHistory[0].health_percentage);
          }
        }

        // 2. Try last_health_percentage directly on equipment
        if (health === null && eq.last_health_percentage !== null) {
          health = parseFloat(eq.last_health_percentage);
        }

        // 3. Calculate from installation_date + equipment_lifespan
        if (health === null && eq.installation_date) {
          const installDate = new Date(eq.installation_date);
          const lifespanYears = eq.equipment_lifespan || 25; // Default 25 years
          const currentDate = new Date();
          
          const ageInMs = currentDate - installDate;
          const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
          
          if (ageInYears < 0) {
            health = 100;
          } else if (ageInYears >= lifespanYears) {
            health = 0;
          } else {
            health = Math.max(0, 100 - (ageInYears / lifespanYears) * 100);
          }
        }

        // Categorize
        if (health !== null) {
          if (health < 25) {
            critico++;
          } else if (health >= 25 && health < 50) {
            atencao++;
          }
        }
      });

      setData({
        totalCount: total,
        atencaoCount: atencao,
        criticoCount: critico,
        atencaoPercentage: total > 0 ? ((atencao / total) * 100).toFixed(1) : 0,
        criticoPercentage: total > 0 ? ((critico / total) * 100).toFixed(1) : 0,
      });
    } catch (err) {
      console.error('Error fetching equipment status counts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    const interval = setInterval(() => {
      fetchCounts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { ...data, loading, error, refetch: fetchCounts };
}