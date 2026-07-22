import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAlarmManagement = () => {
  const [loading, setLoading] = useState(false);

  const checkAndManageAlarm = useCallback(async (health, temperature, equipmentDetails) => {
    if (!equipmentDetails?.id) return;
    setLoading(true);

    try {
      // Check for an existing critical alarm for this equipment
      const { data: existingAlarms, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .eq('equipment_id', equipmentDetails.id)
        .eq('alert_type', 'Equipamento em Nível Crítico')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const criticalAlarm = existingAlarms?.[0];
      const message = `${equipmentDetails.name} - Saúde: ${health.toFixed(1)}% - Ação imediata necessária`;

      if (health < 25) {
        if (!criticalAlarm) {
          // Create new active alarm
          await supabase.from('alerts').insert({
            equipment_id: equipmentDetails.id,
            alert_type: "Equipamento em Nível Crítico",
            health_percentage: health,
            message: message,
            status: "active",
            created_at: new Date().toISOString()
          });
        } else if (criticalAlarm.status === 'resolved') {
          // Reactivate resolved alarm
          await supabase.from('alerts')
            .update({ 
              status: 'active',
              health_percentage: health, 
              message: message,
              resolved_at: null,
              created_at: new Date().toISOString() // Reset timestamp to now since it's re-triggering
            })
            .eq('id', criticalAlarm.id);
        } else {
          // Update existing active alarm with latest health
          await supabase.from('alerts')
            .update({ 
              health_percentage: health, 
              message: message 
            })
            .eq('id', criticalAlarm.id);
        }
      } else if (health >= 25 && criticalAlarm && criticalAlarm.status === 'active') {
        // Resolve alarm if health recovered
        await supabase.from('alerts')
          .update({ 
            status: 'resolved',
            resolved_at: new Date().toISOString() 
          })
          .eq('id', criticalAlarm.id);
      }
    } catch (err) {
      console.error('Error managing alarms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlarmManually = useCallback(async (alarmId) => {
    try {
      await supabase.from('alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alarmId);
    } catch (err) {
      console.error('Error resolving alarm:', err);
      throw err;
    }
  }, []);

  return { checkAndManageAlarm, resolveAlarmManually, loading };
};