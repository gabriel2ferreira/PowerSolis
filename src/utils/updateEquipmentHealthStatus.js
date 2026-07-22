import { supabase } from '@/lib/customSupabaseClient';
import { getHealthStatus } from './calculateRemainingLife';

export const updateEquipmentHealthStatus = async (equipmentId, healthPercentage) => {
  try {
    const { status } = getHealthStatus(healthPercentage);

    // Get current equipment to check if status needs update
    const { data: currentEq, error: fetchError } = await supabase
      .from('equipments')
      .select('status')
      .eq('id', equipmentId)
      .single();

    if (fetchError) throw fetchError;

    // Only update if status is different
    if (currentEq.status !== status) {
      const { error: updateError } = await supabase
        .from('equipments')
        .update({ status })
        .eq('id', equipmentId);

      if (updateError) throw updateError;

      // Log the change in equipment_history
      const { error: historyError } = await supabase
        .from('equipment_history')
        .insert({
          equipment_id: equipmentId,
          field_name: 'status',
          old_value: currentEq.status || 'N/A',
          new_value: status,
          change_type: 'health_status_update'
        });

      if (historyError) {
        console.error('Failed to log history:', historyError);
      }

      return { success: true, newStatus: status };
    }
    
    return { success: true, newStatus: currentEq.status };
  } catch (error) {
    console.error('Error updating equipment health status:', error);
    return { success: false, error };
  }
};