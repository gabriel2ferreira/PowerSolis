import { supabase } from '@/lib/customSupabaseClient';

export const saveEquipmentDataHistory = async (data) => {
  try {
    // 1. Insert into equipment_data_history
    const { data: historyRecord, error: historyError } = await supabase
      .from('equipment_data_history')
      .insert({
        equipment_id: data.equipment_id,
        report_date: data.report_date || new Date().toISOString(),
        health_percentage: data.health_percentage,
        temperature: data.temperature,
        humidity: data.humidity,
        vibration: data.vibration,
        oil_condition: data.oil_condition,
        other_metrics: data.other_metrics || {},
        source: data.source || 'PDF Import',
        notes: data.notes || ''
      })
      .select()
      .single();

    if (historyError) throw historyError;

    // 2. Determine new status
    let newStatus = 'Normal'; // Total
    if (data.health_percentage < 25) {
      newStatus = 'Crítico';
    } else if (data.health_percentage >= 25 && data.health_percentage <= 50) {
      newStatus = 'Atenção';
    }

    // 3. Update equipment record
    const { error: equipmentError } = await supabase
      .from('equipments')
      .update({
        last_health_percentage: data.health_percentage,
        last_temperature: data.temperature,
        updated_at: new Date().toISOString(),
        last_data_source: data.source || 'PDF Import',
        status: newStatus
      })
      .eq('id', data.equipment_id);

    if (equipmentError) throw equipmentError;

    // 4. Handle Alerts
    if (data.health_percentage !== undefined && data.health_percentage !== null) {
      if (data.health_percentage < 25) {
        // Check if active alert exists
        const { data: existingAlerts } = await supabase
          .from('alerts')
          .select('id')
          .eq('equipment_id', data.equipment_id)
          .eq('status', 'active')
          .eq('alert_type', 'CRITICAL_HEALTH');

        if (!existingAlerts || existingAlerts.length === 0) {
          await supabase.from('alerts').insert({
            equipment_id: data.equipment_id,
            alert_type: 'CRITICAL_HEALTH',
            health_percentage: data.health_percentage,
            message: `Saúde crítica detectada via importação: ${data.health_percentage}%`,
            status: 'active'
          });
        }
      } else {
        // Resolve active alerts if health >= 25%
        await supabase.from('alerts')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('equipment_id', data.equipment_id)
          .eq('status', 'active')
          .eq('alert_type', 'CRITICAL_HEALTH');
      }
    }

    return { success: true, data: historyRecord };
  } catch (error) {
    console.error('Error in DataHistoryService:', error);
    return { success: false, error: error.message };
  }
};