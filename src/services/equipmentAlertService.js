import { supabase } from '@/lib/customSupabaseClient';

export const resolveAlerts = async (equipmentId) => {
  try {
    const { error } = await supabase
      .from('equipment_alerts_log')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('equipment_id', equipmentId)
      .eq('status', 'active');
    
    if (error) console.error('Error resolving alerts:', error);
  } catch (err) {
    console.error('Failed to resolve alerts:', err);
  }
};

export const checkAndCreateAlert = async (equipmentId, currentStatus) => {
  try {
    let alertType = null;
    if (currentStatus === 'Crítico') alertType = 'critico';
    else if (currentStatus === 'Atenção') alertType = 'atencao';

    if (!alertType) {
      await resolveAlerts(equipmentId);
      return;
    }

    const { data: activeAlerts, error: fetchErr } = await supabase
      .from('equipment_alerts_log')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('alert_type', alertType)
      .eq('status', 'active');

    if (fetchErr) throw fetchErr;

    const now = new Date().toISOString();

    if (activeAlerts && activeAlerts.length > 0) {
      // Update last triggered
      await supabase
        .from('equipment_alerts_log')
        .update({ last_triggered_at: now, updated_at: now })
        .eq('id', activeAlerts[0].id);
    } else {
      // Resolve other types first
      await resolveAlerts(equipmentId);
      
      // Create new
      await supabase.from('equipment_alerts_log').insert([{
        equipment_id: equipmentId,
        alert_type: alertType,
        status: 'active',
        first_triggered_at: now,
        last_triggered_at: now
      }]);
    }
  } catch (err) {
    console.error('Failed to check/create alert:', err);
  }
};

export const getActiveAlerts = async (equipmentId) => {
  try {
    const { data, error } = await supabase
      .from('equipment_alerts_log')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error getting active alerts:', err);
    return [];
  }
};