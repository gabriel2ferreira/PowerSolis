import { useState, useEffect, useCallback } from 'react';

export const useProjectedDegradation = (equipmentId, daysAhead = 365, standard = 'IEEE') => {
  const [data, setData] = useState({
    projectedCurve: [],
    thresholdDates: { atenção: null, crítico: null, endOfLife: null }
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateProjection = useCallback(async () => {
    setIsLoading(true);
    // Simulate projection based on a steady degradation rate (1% per month for demo purposes)
    const curve = [];
    const now = new Date();
    let currentHealth = 95; // Starting point
    let thresholds = { atenção: null, crítico: null, endOfLife: null };
    
    for (let i = 0; i <= daysAhead; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      currentHealth -= (0.05); // Degrade slightly every day
      const health = Math.max(0, currentHealth);
      
      curve.push({
        date: date.toISOString(),
        health: parseFloat(health.toFixed(2)),
        LOL: parseFloat((100 - health).toFixed(2)),
        temperature: 75 + Math.sin(i) * 5
      });

      if (!thresholds.atenção && health <= 50) thresholds.atenção = date;
      if (!thresholds.crítico && health <= 25) thresholds.crítico = date;
      if (!thresholds.endOfLife && health <= 0) thresholds.endOfLife = date;
    }

    setData({ projectedCurve: curve, thresholdDates: thresholds });
    setIsLoading(false);
  }, [daysAhead]);

  useEffect(() => {
    if(equipmentId) calculateProjection();
  }, [equipmentId, calculateProjection]);

  return { ...data, isLoading, error: null };
};