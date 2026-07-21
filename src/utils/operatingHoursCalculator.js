import { differenceInHours } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';

export const calculateOperatingHours = (installationDate, modificationDate = new Date()) => {
  if (!installationDate) return 0;
  const hours = differenceInHours(new Date(modificationDate), new Date(installationDate));
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
      const hours = differenceInHours(new Date(modificationDate), new Date(installationDate));
      
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