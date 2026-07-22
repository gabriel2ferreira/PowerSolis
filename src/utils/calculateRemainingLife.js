import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatRemainingLife = (days) => {
  if (days <= 0) return "Fim de Vida Útil";
  
  const years = Math.floor(days / 365.25);
  const remainingDays = days % 365.25;
  const months = Math.floor(remainingDays / 30.44);
  const finalDays = Math.floor(remainingDays % 30.44);

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  if (finalDays > 0) parts.push(`${finalDays} ${finalDays === 1 ? 'dia' : 'dias'}`);

  return parts.length > 0 ? parts.join(', ') : 'Menos de 1 dia';
};

export const getHealthStatus = (healthPercentage) => {
  if (healthPercentage <= 0) return { status: 'Fim de Vida', color: 'var(--health-expired)' };
  if (healthPercentage <= 25) return { status: 'Crítico', color: 'var(--health-critical)' };
  if (healthPercentage < 50) return { status: 'Atenção', color: 'var(--health-attention)' };
  return { status: 'Normal', color: 'var(--health-normal)' };
};

export const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'Normal': return 'default';
    case 'Atenção': return 'secondary';
    case 'Crítico': return 'destructive';
    case 'Fim de Vida': return 'outline';
    default: return 'default';
  }
};

export const formatDateBR = (date) => {
  if (!date || !isValid(new Date(date))) return 'Data inválida';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
};

export const calculateDaysSinceInstallation = (installationDate) => {
  if (!installationDate) return null;
  const installDate = new Date(installationDate);
  const today = new Date();
  
  const diffTime = today.getTime() - installDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays;
};

export const calculateEndOfLifeDate = (installationDate, lifespanYears) => {
  if (!installationDate || !lifespanYears) return null;
  const installDate = new Date(installationDate);
  return new Date(installDate.getTime() + (lifespanYears * 365.25 * 24 * 60 * 60 * 1000));
};