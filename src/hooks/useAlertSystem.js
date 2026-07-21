import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAlertSystem = (equipmentId, healthPercentage, equipmentName) => {
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const storageKey = equipmentId ? `equipment_alert_dismissed_${equipmentId}` : null;
  const [dismissedLocally, setDismissedLocally] = useState(() => {
    if (!storageKey) return false;
    return localStorage.getItem(storageKey) === '1';
  });

  const fetchAlerts = useCallback(async () => {
    if (!equipmentId) return;
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (data) {
      setAlerts(data);
      const active = data.find(a => a.status === 'active');
      if (active && !dismissedLocally) {
        setActiveAlert({
          shouldShowAlert: true,
          alertType: active.alert_type,
          alertMessage: active.message
        });
      } else {
        setActiveAlert(null);
      }
    }
  }, [equipmentId, dismissedLocally]);

  const createAlert = useCallback(async (type, message) => {
    if (!equipmentId) return;
    await supabase.from('alerts').insert({
      equipment_id: equipmentId,
      alert_type: type,
      health_percentage: healthPercentage || 0,
      message,
      status: 'active'
    });
    // ao criar um novo alerta, limpamos o dismiss local
    if (storageKey) {
      localStorage.removeItem(storageKey);
      setDismissedLocally(false);
    }
    fetchAlerts();
  }, [equipmentId, healthPercentage, fetchAlerts, storageKey]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (healthPercentage !== null && healthPercentage !== undefined) {
      const isCritical = healthPercentage < 25;
      const isWarning = healthPercentage < 50 && healthPercentage >= 25;

      const existingAlert = alerts.find(a => a.status === 'active');

      if (isCritical && (!existingAlert || existingAlert.alert_type !== 'Crítico')) {
        createAlert('Crítico', `A saúde do equipamento ${equipmentName || ''} atingiu nível Crítico.`);
      } else if (isWarning && (!existingAlert || existingAlert.alert_type !== 'Atenção')) {
        createAlert('Atenção', `A saúde do equipamento ${equipmentName || ''} requer Atenção.`);
      }
    }
  }, [healthPercentage, equipmentName, createAlert, alerts]);

  const dismissAlert = async () => {
    if (alerts.length > 0) {
      const active = alerts.find(a => a.status === 'active');
      if (active) {
        await supabase
          .from('alerts')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', active.id);
        fetchAlerts();
      }
    }
    if (storageKey) {
      localStorage.setItem(storageKey, '1');
      setDismissedLocally(true);
    }
    setActiveAlert(null);
  };

  return {
    shouldShowAlert: activeAlert?.shouldShowAlert || false,
    alertType: activeAlert?.alertType || 'info',
    alertMessage: activeAlert?.alertMessage || '',
    dismissAlert,
    alerts
  };
};