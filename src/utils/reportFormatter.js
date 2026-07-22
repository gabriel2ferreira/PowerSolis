import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatEquipmentData = (equipment) => {
  if (!equipment) return {};
  return {
    id: equipment.id,
    name: equipment.name || 'N/A',
    type: equipment.equipment_types?.name || 'Transformador',
    installationDate: equipment.created_at ? formatDate(equipment.created_at) : 'N/A',
    location: equipment.location_name || `${equipment.city || ''}, ${equipment.state || ''}` || 'N/A',
    manufacturer: equipment.manufacturer || 'N/A',
    model: equipment.model || 'N/A',
    voltage: equipment.voltage_level || 'N/A',
    power: equipment.power_rating || 'N/A',
    status: equipment.status || 'Ativo',
    coolingSystem: equipment.cooling_system || 'ONAN',
    insulationType: equipment.insulation_type || 'Classe A',
    oilType: equipment.oil_type || 'Mineral',
    ratedFrequency: equipment.rated_frequency || '60 Hz',
    impedance: equipment.impedance || 'N/A'
  };
};

export const formatHistoricalData = (metricsData) => {
  if (!metricsData || metricsData.length === 0) return [];
  return metricsData.map(m => ({
    date: formatDate(m.timestamp),
    hotspot: m.metric_type === 'hotspot_temp' ? m.metric_value : '-',
    ambient: m.metric_type === 'ambient_temp' ? m.metric_value : '-',
    hours: m.metric_type === 'operating_hours' ? m.metric_value : '-',
    health: m.metric_type === 'health_index' ? m.metric_value : '-'
  }));
};

export const calculateHealthStatus = (metricsData) => {
  if (!metricsData || metricsData.length === 0) return 85;
  const healthMetric = metricsData.find(m => m.metric_type === 'health_index');
  return healthMetric ? parseFloat(healthMetric.metric_value) : 85; 
};

export const calculateRemainingLife = (metricsData) => {
  if (!metricsData || metricsData.length === 0) return 20.5;
  const lifeMetric = metricsData.find(m => m.metric_type === 'remaining_life');
  return lifeMetric ? parseFloat(lifeMetric.metric_value) : 20.5;
};

export const getRecommendations = (healthStatus) => {
  if (healthStatus > 70) return "Equipamento operando normalmente. Continue monitoramento regular com inspeções visuais trimestrais.";
  if (healthStatus >= 50) return "Equipamento em bom estado. Aumente frequência de monitoramento. Recomendado análise de óleo semestral.";
  if (healthStatus >= 30) return "Equipamento requer atenção. Planeje manutenção preventiva. Inspecionar termografia e realizar ensaios elétricos.";
  return "Equipamento crítico. Ação imediata necessária. Considere substituição ou reforma geral imediata.";
};

export const formatDate = (date, includeTime = false) => {
  if (!date) return 'N/A';
  const formatStr = includeTime ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy';
  return format(new Date(date), formatStr, { locale: ptBR });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};