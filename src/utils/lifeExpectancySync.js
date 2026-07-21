import { supabase } from '@/lib/customSupabaseClient';
import { 
  calculateIEEEEquivalentAgingFactor, 
  calculateIEEELossOfLife, 
  calculateIEEEHealthPercentage 
} from '@/utils/lifeExpectancyCalculations';
import { getInsulationLifeHours, getDefaultAgingFactor } from '@/utils/equipmentInsulationConfig';
import { addYears, differenceInDays } from 'date-fns';

/* 
  TASK 1 & 3: lifeExpectancySync.js
  Replicates exact calculation methods from Asset Management to ensure a single source of truth.
*/

export const getHealthStatus = (healthPercentage) => {
  const health = Number(healthPercentage);
  if (health <= 0) return { label: 'Fim de Vida', variant: 'destructive', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/50' };
  if (health < 25) return { label: 'Crítico', variant: 'destructive', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/50' };
  if (health <= 75) return { label: 'Atenção', variant: 'secondary', color: 'text-yellow-500', bg: 'bg-yellow-500 text-black', border: 'border-yellow-500/50' };
  return { label: 'Bom', variant: 'default', color: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/50' };
};

export const getAccelerationFactorStatusSync = (fA) => {
  const val = Number(fA);
  if (isNaN(val)) return { status: 'N/A', color: 'gray', bg: 'bg-slate-500', border: 'border-slate-500/50' };
  if (val < 1.0) return { status: 'Bom', color: 'green', bg: 'bg-green-500', border: 'border-green-500/50' };
  if (val <= 1.5) return { status: 'Atenção', color: 'yellow', bg: 'bg-yellow-500 text-black', border: 'border-yellow-500/50' };
  return { status: 'Crítico', color: 'red', bg: 'bg-red-500', border: 'border-red-500/50' };
};

export const calculateTemperatureStats = (thermalData) => {
  if (!thermalData || thermalData.length === 0) {
    return { peakTemp: 0, averageTemp: 0, minTemp: 0, currentTemp: null, lastReadingDate: null };
  }
  const temps = thermalData.map(d => parseFloat(d.hot_spot_temperature) || parseFloat(d.ambient_temperature) || 0).filter(t => t > 0);
  if (temps.length === 0) return { peakTemp: 0, averageTemp: 0, minTemp: 0, currentTemp: null, lastReadingDate: null };

  const peakTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const averageTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const currentTemp = temps[temps.length - 1];
  const lastReadingDate = new Date(thermalData[thermalData.length - 1].timestamp);

  return { peakTemp, averageTemp, minTemp, currentTemp, lastReadingDate };
};

export const calculateHealthMetrics = (thermalData, equipmentType) => {
  let currentHealth = 100;
  let currentLOL = 0;

  if (thermalData && thermalData.length > 0) {
    const readings = thermalData.map(d => ({ 
      temperature: parseFloat(d.hot_spot_temperature) || parseFloat(d.ambient_temperature) || 0, 
      timeStep: 1 
    }));
    const feqa = calculateIEEEEquivalentAgingFactor(readings);
    const lolHours = calculateIEEELossOfLife(feqa, getDefaultAgingFactor(), getInsulationLifeHours(equipmentType));
    currentLOL = lolHours;
    currentHealth = calculateIEEEHealthPercentage(currentLOL);
  }

  return { currentHealth, currentLOL };
};

export const calculateAccelerationFactor = (temperature) => {
  if (!temperature) return 1.0;
  const tActualK = Number(temperature) + 273.15;
  const tRefK = 55 + 273.15; // standard ref 55C
  const fA = Math.exp(9000 * (1 / tRefK - 1 / tActualK));
  return Number(fA.toFixed(2));
};

export const calculateEndOfLifeDate = (installationDate, lifespanYears, faValue) => {
  if (!installationDate) return null;
  const instDate = new Date(installationDate);
  const effectiveLifespan = (lifespanYears || 25) / Math.max(faValue || 1, 0.1);
  return addYears(instDate, effectiveLifespan);
};

export const fetchEquipmentDataHistory = async (equipmentId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [eqRes, thermalRes, thermal30dRes, historyRes, maintRes] = await Promise.all([
    supabase.from('equipments').select(`*, equipment_types(name)`).eq('id', equipmentId).single(),
    supabase.from('equipment_thermal_data').select('*').eq('equipment_id', equipmentId).order('timestamp', { ascending: true }),
    supabase.from('equipment_thermal_data').select('*').eq('equipment_id', equipmentId).gte('timestamp', thirtyDaysAgo.toISOString()).order('timestamp', { ascending: true }),
    supabase.from('equipment_data_history').select('*').eq('equipment_id', equipmentId).order('created_at', { ascending: true }),
    supabase.from('equipment_history').select('*').eq('equipment_id', equipmentId).order('changed_at', { ascending: false })
  ]);

  if (eqRes.error) throw eqRes.error;

  return {
    equipment: eqRes.data,
    thermalDataAll: thermalRes.data || [],
    thermalData30d: thermal30dRes.data || [],
    historyData: historyRes.data || [],
    maintenanceData: maintRes.data || []
  };
};