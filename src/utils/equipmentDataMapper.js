import { supabase } from '@/lib/customSupabaseClient';
import { calculateEquipmentHealth } from './healthCalculation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getEquipmentWithAllData = async (equipmentId) => {
  try {
    const { data: equipment, error: eqError } = await supabase
      .from('equipments')
      .select(`
        *,
        equipment_types(id, name),
        custom_fields(id, field_name, observations),
        equipment_api_config(*)
      `)
      .eq('id', equipmentId)
      .single();

    if (eqError) throw eqError;

    const customFieldsMap = {};
    if (equipment.custom_fields) {
      equipment.custom_fields.forEach(cf => {
        customFieldsMap[cf.field_name] = cf.observations;
      });
    }

    return {
      ...equipment,
      custom_fields: customFieldsMap,
      api_config: Array.isArray(equipment.equipment_api_config) ? equipment.equipment_api_config[0] : equipment.equipment_api_config
    };
  } catch (error) {
    console.error("Error fetching equipment full data:", error);
    throw error;
  }
};

export const getAllEquipmentsBasic = async (includeTypes = false) => {
  try {
    let selectQuery = `
      *,
      equipment_api_config(*)
    `;
    if (includeTypes) {
      selectQuery = `
        *,
        equipment_types(id, name),
        equipment_api_config(*)
      `;
    }

    const { data, error } = await supabase
      .from('equipments')
      .select(selectQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching equipments:", error);
      return [];
    }

    return data.map(eq => ({
      ...eq,
      api_config: Array.isArray(eq.equipment_api_config) ? eq.equipment_api_config[0] : eq.equipment_api_config
    }));
  } catch (error) {
    console.error("Error fetching all equipments:", error);
    return [];
  }
};

export const getEquipmentHistory = async (equipmentId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('equipment_health_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching equipment history for ${equipmentId}:`, error);
    return [];
  }
};

export const getLatestHealthRecord = async (equipmentId) => {
  try {
    const { data, error } = await supabase
      .from('equipment_health_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error(`Error fetching latest health record for ${equipmentId}:`, error);
    return null;
  }
};

export const mapEquipmentToDisplay = (equipment) => {
  if (!equipment) return null;

  const equipmentType = equipment.equipment_types?.name || equipment.equipment_type || 'N/A';
  const apiConfigArray = equipment.equipment_api_config || equipment.api_config;
  const apiConfigRaw = Array.isArray(apiConfigArray) ? apiConfigArray[0] : (apiConfigArray || {});

  // Pass normalized config to calculateEquipmentHealth
  const tempEquipmentForHealth = {
    ...equipment,
    api_config: apiConfigRaw
  };
  
  const healthData = calculateEquipmentHealth(tempEquipmentForHealth);

  return {
    id: equipment.id || 'N/A',
    name: equipment.name || 'N/A',
    type: equipmentType,
    status: equipment.status || healthData.status || 'N/A',
    location: equipment.location_name || 'N/A',
    city: equipment.city || 'N/A',
    state: equipment.state || 'N/A',
    installationDate: equipment.installation_date 
      ? format(new Date(equipment.installation_date), 'dd/MM/yyyy', { locale: ptBR })
      : 'N/A',
    equipmentLifespan: Number(equipment.equipment_lifespan) || 0,
    health: {
      percentage: Number(healthData.percentage) || 0,
      color: healthData.color || '#ef4444',
      status: healthData.status || 'N/A',
      vidaRemanescenteAnos: Number(healthData.vidaRemanescenteAnos) || 0,
      fatorAceleracao: Number(healthData.fatorAceleracao) || 1,
      tempoModel: healthData.tempoModel || {},
      faaModel: healthData.faaModel || {},
      estrategiaUsada: healthData.estrategiaUsada || 'N/A'
    },
    apiConfig: {
      horasOperacao: Number(apiConfigRaw.horas_operacao) || 0,
      pontoQuenteExterno: Number(apiConfigRaw.ponto_quente_externo) || 0,
      temperaturaAmbiente: Number(apiConfigRaw.temperatura_ambiente) || 0,
      vidaUtilIsolamentoH: Number(apiConfigRaw.vida_util_isolamento_h) || 0,
      estrategiaEnvelhecimento: apiConfigRaw.estrategia_envelhecimento || 'N/A',
      tangentePerdas: Number(apiConfigRaw.tangente_perdas) || 0,
      correntePrimario: Number(apiConfigRaw.corrente_primario) || 0,
      tempRef: Number(apiConfigRaw.temp_ref) || 0,
      vidaRefAnos: Number(apiConfigRaw.vida_ref_anos) || 0,
      p: Number(apiConfigRaw.p) || 0
    },
    raw: equipment
  };
};

export const formatHealthHistory = (history) => {
  if (!Array.isArray(history)) return [];
  
  return history.map(record => {
    const timestamp = record.timestamp || record.created_at;
    return {
      ...record,
      formattedDate: timestamp ? format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data inválida',
      displayHealth: Number(record.saude_percent_final || 0).toFixed(1) + '%',
      displayLife: Number(record.vida_remanescente_anos_final || 0).toFixed(1) + ' anos',
      displayAcceleration: Number(record.fator_aceleracao || 1).toFixed(2) + 'x',
      statusColor: record.status_final === 'Bom' ? '#22c55e' : (record.status_final === 'Atenção' ? '#f97316' : '#ef4444')
    };
  });
};

export const compareHealthRecords = (current, previous) => {
  if (!current) return null;
  if (!previous) return { trend: 'stable', diff: 0, currentHealth: current.saude_percent_final };

  const currentHealth = Number(current.saude_percent_final || 0);
  const previousHealth = Number(previous.saude_percent_final || 0);
  const diff = currentHealth - previousHealth;

  const currentLife = Number(current.vida_remanescente_anos_final || 0);
  const previousLife = Number(previous.vida_remanescente_anos_final || 0);
  const lifeDiff = currentLife - previousLife;

  let trend = 'stable';
  if (diff > 0.5) trend = 'up';
  else if (diff < -0.5) trend = 'down';

  return {
    trend,
    diff: Number(diff.toFixed(2)),
    diffText: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
    currentHealth,
    previousHealth,
    vidaRemanescenteDiff: Number(lifeDiff.toFixed(2)),
    vidaRemanescenteDiffText: `${lifeDiff > 0 ? '+' : ''}${lifeDiff.toFixed(1)} anos`,
    isDegradingFaster: lifeDiff < 0
  };
};