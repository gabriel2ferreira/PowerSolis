import { getHealthPercentage } from './healthDisplay';

export const getStatusColor = (status) => {
  if (status === 'Crítico') return '#ef4444'; // red-500
  if (status === 'Atenção') return '#eab308'; // yellow-500
  if (status === 'Bom') return '#22c55e'; // green-500
  return '#94a3b8'; // slate-400 (default)
};

export const getStatusLabel = (status) => {
  if (status === 'Crítico') return 'Crítico';
  if (status === 'Atenção') return 'Atenção';
  if (status === 'Bom') return 'Bom';
  return 'Desconhecido';
};

export const getEquipmentStatus = (equipment) => {
  const healthPercentage = getHealthPercentage(equipment);
  
  let status = 'Crítico';
  if (healthPercentage >= 80) {
    status = 'Bom';
  } else if (healthPercentage >= 50) {
    status = 'Atenção';
  }

  return {
    status,
    color: getStatusColor(status),
    healthPercentage
  };
};