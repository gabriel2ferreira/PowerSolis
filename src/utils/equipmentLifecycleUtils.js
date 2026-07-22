export const formatTo2Decimals = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return Number(value).toFixed(2);
};

export const calculateHealthPercentage = (lifeLossPercent) => {
  const ll = Number(lifeLossPercent) || 0;
  return Math.max(0, Math.min(100, 100 - ll));
};

export const calculateEndOfLifeDate = (installationDate, endOfLifeHours, equipmentLifespan) => {
  if (!installationDate) return null;
  const installDate = new Date(installationDate);
  
  let dateA = null;
  if (equipmentLifespan) {
    dateA = new Date(installDate);
    dateA.setFullYear(dateA.getFullYear() + Number(equipmentLifespan));
  }
  
  let dateB = null;
  if (endOfLifeHours) {
    dateB = new Date(installDate);
    dateB.setHours(dateB.getHours() + Number(endOfLifeHours));
  }

  if (!dateA && !dateB) return null;
  if (!dateA) return { dateA, dateB, closestDate: dateB, basedOn: 'horas' };
  if (!dateB) return { dateA, dateB, closestDate: dateA, basedOn: 'saúde' };

  const closestDate = dateA < dateB ? dateA : dateB;
  const basedOn = dateA < dateB ? 'saúde' : 'horas';

  return { dateA, dateB, closestDate, basedOn };
};

export const getAccelerationFactorStatus = (fA) => {
  const val = Number(fA);
  if (isNaN(val)) return { status: 'N/A', color: 'gray' };
  if (val < 1.0) return { status: 'Bom', color: 'green' };
  if (val <= 1.5) return { status: 'Atenção', color: 'yellow' };
  return { status: 'Crítico - Envelhecimento Acelerado', color: 'red' };
};

export const getComparisonStatus = (state, cluster) => {
  const isCritical = state === 'Crítico' || cluster === 'Alto Risco' || state === 'Crítico - Envelhecimento Acelerado';
  const isWarning = state === 'Atenção' || cluster === 'Atenção';
  
  if (isCritical) return { status: 'Crítico', color: 'red' };
  if (isWarning) return { status: 'Atenção', color: 'yellow' };
  return { status: 'Bom', color: 'green' };
};