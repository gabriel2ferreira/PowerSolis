import { supabase } from '@/lib/customSupabaseClient';

export const updateEquipmentStatus = async (equipmentId, healthPercentage) => {
  try {
    let newStatus = 'Normal';
    if (healthPercentage < 25) {
      newStatus = 'Crítico';
    } else if (healthPercentage < 50) {
      newStatus = 'Atenção';
    }

    const { error } = await supabase
      .from('equipments')
      .update({ status: newStatus })
      .eq('id', equipmentId);

    if (error) {
      console.error('Error updating equipment status:', error);
      throw error;
    }

    return newStatus;
  } catch (error) {
    console.error('Failed to update equipment status:', error);
    return null;
  }
};