import { addHours, isBefore, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatTo2Decimals = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return Number(value).toFixed(2);
};

export const calculateHealthPercentage = (lifeLossPercent) => {
  const health = 100 - (lifeLossPercent || 0);
  return Math.max(0, Math.min(100, health));
};

export const calculateMaximumDateLimit = (installationDate, endOfLifeHours) => {
  if (!installationDate || !endOfLifeHours) return null;
  const install = new Date(installationDate);
  return addHours(install, endOfLifeHours);
};

export const getClosestEndOfLifeDate = (healthBasedDate, hoursBasedDate) => {
  if (!healthBasedDate && !hoursBasedDate) return { date: null, reason: 'N/A' };
  if (!healthBasedDate) return { date: hoursBasedDate, reason: 'horas' };
  if (!hoursBasedDate) return { date: healthBasedDate, reason: 'saúde' };

  const hbDate = new Date(healthBasedDate);
  const hoDate = new Date(hoursBasedDate);

  if (isBefore(hbDate, hoDate)) {
    return { date: hbDate, reason: 'saúde' };
  } else {
    return { date: hoDate, reason: 'horas' };
  }
};

export const getAccelerationFactorStatus = (fA) => {
  const value = Number(fA);
  if (isNaN(value) || value === null) return { text: 'N/A', color: 'text-muted-foreground', bg: 'bg-muted' };
  if (value < 1.0) return { text: 'Bom', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10', colorHex: '#22c55e' };
  if (value <= 1.5) return { text: 'Atenção', color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10', colorHex: '#eab308' };
  return { text: 'Crítico - Envelhecimento Acelerado', color: 'text-[hsl(var(--destructive))]', bg: 'bg-[hsl(var(--destructive))]/10', colorHex: '#ef4444' };
};

export const getComparisonStatus = (healthTrend) => {
  if (healthTrend > 0) return { text: 'Bom', color: 'text-[hsl(var(--success))]' };
  if (healthTrend === 0) return { text: 'Atenção', color: 'text-[hsl(var(--warning))]' };
  return { text: 'Crítico', color: 'text-[hsl(var(--destructive))]' };
};