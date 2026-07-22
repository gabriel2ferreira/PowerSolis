
import { differenceInHours } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';

export const calculateOperatingHours = (installationDate, modificationDate = new Date()) => {
  if (!installationDate) return 0;
  const hours = differenceInHours(new Date(modificationDate), new Date(installationDate));
  return Math.max(0, hours);
};

export const calculateHoursBetweenDates = (startDate, endDate = new Date()) => {
  if (!startDate) return 0;
  const hours = differenceInHours(new Date(endDate), new Date(startDate));
  return Math.max(0, hours);
};

export const updateOperatingHours = async (equipmentId) => {
  try {
    const { data: eq } = await supabase
      .from('equipments')
      .select('installation_date')
      .eq('id', equipmentId)
      .maybeSingle();

    if (eq && eq.installation_date) {
      const installationDate = new Date(eq.installation_date);
      const modificationDate = new Date();
      const hours = Math.max(0, differenceInHours(modificationDate, installationDate));
      
      const { data: existingConfig } = await supabase
        .from('equipment_api_config')
        .select('id')
        .eq('equipment_id', equipmentId)
        .maybeSingle();

      if (existingConfig) {
        await supabase
          .from('equipment_api_config')
          .update({ horas_operacao: hours })
          .eq('equipment_id', equipmentId);
      } else {
        await supabase
          .from('equipment_api_config')
          .insert({ equipment_id: equipmentId, horas_operacao: hours });
      }
      
      return hours;
    }
    return 0;
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return 0;
  }
};

export const getOperatingHoursForMultiple = async (equipmentIds) => {
  if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) return {};
  
  try {
    const { data: equipments } = await supabase
      .from('equipments')
      .select('id, installation_date')
      .in('id', equipmentIds);

    const results = {};
    
    if (equipments) {
      equipments.forEach(eq => {
        if (eq.installation_date) {
          const installationDate = new Date(eq.installation_date);
          const modificationDate = new Date();
          results[eq.id] = Math.max(0, differenceInHours(modificationDate, installationDate));
        } else {
          results[eq.id] = 0;
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error getting operating hours for multiple equipments:', error);
    return {};
  }
};
