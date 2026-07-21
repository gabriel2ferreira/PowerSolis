import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AlertNotification = ({ alertType, equipmentName, healthPercentage, shouldShowAlert, onDismiss }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (shouldShowAlert && alertType) {
      const isCritical = alertType === 'Crítico';
      const title = isCritical ? 'Alerta Crítico' : 'Alerta de Atenção';
      const description = `Equipamento ${equipmentName || 'Desconhecido'} saiu da zona segura - Saúde: ${healthPercentage?.toFixed(1)}%`;
      
      toast({
        title,
        description,
        variant: isCritical ? 'destructive' : 'default',
        className: isCritical ? '' : 'bg-orange-500 text-white border-none',
        duration: 5000,
      });

      if (onDismiss) {
        onDismiss();
      }
    }
  }, [shouldShowAlert, alertType, equipmentName, healthPercentage, toast, onDismiss]);

  return null;
};

export default AlertNotification;