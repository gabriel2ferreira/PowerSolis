import { useState, useEffect, useCallback } from 'react';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateHealthMetrics } from '@/utils/calculateHealthMetrics';
import { 
  calculateTCRemainingLifespan, 
  getAccelerationFactorStatus as getTcFaStatus, 
  calculateAccelerationFactor as calculateTcFa 
} from '@/utils/tcLifespanCalculations';
import { getAccelerationFactorStatus as getNonTcFaStatus } from '@/utils/equipmentLifecycleUtils';

export const useLifeExpectancySync = (equipmentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const syncData = useCallback(async () => {
    if (!equipmentId) return;
    setLoading(true);
    setError(null);

    try {
      console.log(`[Sync] Fetching synced data for equipment ${equipmentId}`);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch identical raw data
      const [eqRes, thermalAllRes, thermal30dRes, historyAllRes, maintRes] = await Promise.all([
        supabase.from('equipments').select(`*, equipment_types(name)`).eq('id', equipmentId).single(),
        supabase.from('equipment_thermal_data').select('*').eq('equipment_id', equipmentId).order('timestamp', { ascending: true }),
        supabase.from('equipment_thermal_data').select('*').eq('equipment_id', equipmentId).gte('timestamp', thirtyDaysAgo.toISOString()).order('timestamp', { ascending: true }),
        supabase.from('equipment_data_history').select('*').eq('equipment_id', equipmentId).order('created_at', { ascending: true }),
        supabase.from('equipment_history').select('*').eq('equipment_id', equipmentId).order('changed_at', { ascending: false })
      ]);

      if (eqRes.error) throw eqRes.error;

      const equipment = eqRes.data;
      const thermalDataAll = thermalAllRes.data || [];
      const thermalData30d = thermal30dRes.data || [];
      const historyData = historyAllRes.data || [];
      const maintenanceData = maintRes.data || [];

      const isTC = equipment.equipment_types?.name === 'TC';

      // --- 1. Temperature Statistics (30 days logic parity with HealthDetailsPanel) ---
      let peakTemp = 0;
      let minTemp = 0;
      let averageTemp = 0;
      let currentTemp = null;
      let lastReadingDate = null;

      if (thermalData30d.length > 0) {
        const temps = thermalData30d.map(d => parseFloat(d.hot_spot_temperature) || parseFloat(d.ambient_temperature) || 0).filter(t => t > 0);
        if (temps.length > 0) {
          peakTemp = Math.max(...temps);
          minTemp = Math.min(...temps);
          averageTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        }
        const lastRec = thermalData30d[thermalData30d.length - 1];
        currentTemp = parseFloat(lastRec.hot_spot_temperature) || parseFloat(lastRec.ambient_temperature) || null;
        lastReadingDate = new Date(lastRec.timestamp);
      } else if (historyData.length > 0) {
        const temps = historyData.map(d => parseFloat(d.temperature) || 0).filter(t => t > 0);
        if (temps.length > 0) {
          peakTemp = Math.max(...temps);
          minTemp = Math.min(...temps);
          averageTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        }
        const lastRec = historyData[historyData.length - 1];
        currentTemp = parseFloat(lastRec.temperature) || null;
        lastReadingDate = lastRec.created_at ? new Date(lastRec.created_at) : null;
      }

      // --- 2. Health, LOL, FA, and End of Life Calculations ---
      let health = 100;
      let lol = 0;
      let faValue = 1.0;
      let expectedEndOfLifeDate = null;
      let rawHealthStatus = 'Bom';
      let rawFaStatus = 'Bom';

      if (isTC) {
        // TC calculations using precise AM methods
        const formattedHistory = historyData.map(h => ({
          date: h.created_at,
          temperature: h.temperature
        })).filter(h => h.temperature !== null && h.temperature !== undefined);
        
        const tcData = calculateTCRemainingLifespan(equipment.installation_date, formattedHistory, 55);
        
        health = tcData.remainingPercentage;
        lol = Math.max(0, 100 - health);
        expectedEndOfLifeDate = tcData.closestEndDate;
        faValue = tcData.accelerationFactor;
        rawHealthStatus = tcData.healthStatus;
        rawFaStatus = getTcFaStatus(faValue).status;
      } else {
        // Non-TC calculations using precise AM methods
        const healthData = calculateHealthMetrics(thermalData30d, equipment, 'IEEE');
        
        health = healthData.health;
        lol = healthData.lol;
        expectedEndOfLifeDate = healthData.projectedEndOfLife;
        rawHealthStatus = healthData.status;

        if (historyData.length > 0) {
           const lastHist = historyData[historyData.length - 1];
           faValue = lastHist.acceleration_factor ?? calculateTcFa(currentTemp); 
        } else {
           faValue = calculateTcFa(currentTemp);
        }
        rawFaStatus = getNonTcFaStatus(faValue).status;
      }

      // --- 3. UI Display Mapping ---
      const buildHealthStatus = (label) => {
        const normalized = label.toLowerCase();
        if (normalized.includes('bom') || normalized.includes('normal')) 
          return { label: 'Bom', bg: 'bg-green-500', color: 'text-green-500', border: 'border-green-500/50' };
        if (normalized.includes('atenção')) 
          return { label: 'Atenção', bg: 'bg-yellow-500 text-black', color: 'text-yellow-500', border: 'border-yellow-500/50' };
        return { label: 'Crítico', bg: 'bg-red-500', color: 'text-red-500', border: 'border-red-500/50' };
      };

      const buildFaStatus = (label) => {
        const normalized = label.toLowerCase();
        if (normalized.includes('bom')) 
          return { status: 'Bom', bg: 'bg-green-500', color: 'text-green-500', border: 'border-green-500/50' };
        if (normalized.includes('atenção')) 
          return { status: 'Atenção', bg: 'bg-yellow-500 text-black', color: 'text-yellow-500', border: 'border-yellow-500/50' };
        return { status: 'Crítico', bg: 'bg-red-500', color: 'text-red-500', border: 'border-red-500/50' };
      };

      const healthStatus = buildHealthStatus(rawHealthStatus);
      const faStatus = buildFaStatus(rawFaStatus);

      // --- 4. Expiration and Days ---
      const isExpired = expectedEndOfLifeDate && expectedEndOfLifeDate < new Date();
      const daysRemaining = expectedEndOfLifeDate ? Math.max(0, differenceInDays(expectedEndOfLifeDate, new Date())) : 0;
      const expectedEndOfLifeStr = expectedEndOfLifeDate ? format(expectedEndOfLifeDate, 'dd/MM/yyyy') : 'N/A';
      const instDate = equipment.installation_date ? new Date(equipment.installation_date) : null;
      const instDateStr = instDate ? format(instDate, 'dd/MM/yyyy') : 'N/A';

      const stats = {
        health,
        lol,
        peakTemp,
        averageTemp,
        minTemp,
        currentTemp,
        lastReadingDate,
        faValue,
        healthStatus,
        faStatus,
        expectedEndOfLifeDate,
        expectedEndOfLifeStr,
        instDateStr,
        isExpired,
        daysRemaining,
        equipmentStatus: equipment.status || 'Desconhecido'
      };

      // --- 5. Chart Data Sync ---
      const tempChartData = thermalDataAll.map(d => ({
        date: format(new Date(d.timestamp), 'dd/MM HH:mm'),
        Temperatura: Number(d.hot_spot_temperature) || Number(d.ambient_temperature) || 0
      }));

      if (tempChartData.length === 0 && historyData.length > 0) {
         historyData.filter(d => d.temperature !== null).forEach(d => {
           tempChartData.push({
             date: format(new Date(d.created_at || d.report_date), 'dd/MM HH:mm'),
             Temperatura: Number(d.temperature) || 0
           });
         });
      }

      const faChartData = historyData.filter(d => d.acceleration_factor !== null).map(d => ({
        date: format(new Date(d.created_at || d.report_date), 'MM/yyyy'),
        fullDate: format(new Date(d.created_at || d.report_date), 'dd/MM/yyyy HH:mm'),
        fA: Number(d.acceleration_factor) || 1.0
      }));

      // Validation Logs
      console.log(`[Sync Validation] Equipment: ${equipment.name} (${equipment.equipment_types?.name})`);
      console.log(`[Sync Validation] AM Health: ${stats.health.toFixed(1)}%, fA: ${stats.faValue.toFixed(2)}, Status: ${rawHealthStatus}`);

      setData({
        stats,
        chartData: { tempChartData, faChartData },
        raw: { equipment, thermalDataAll, thermalData30d, historyData, maintenanceData }
      });

    } catch (err) {
      console.error("[Sync Error]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  return { ...data, loading, error, refetch: syncData };
};