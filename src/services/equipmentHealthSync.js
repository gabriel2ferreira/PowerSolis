import { supabase } from '@/lib/customSupabaseClient';
import { calcularSaudeEquipamento, VIDA_UTIL_ISOLAMENTO_H } from '@/utils/equipmentAging';
import { logger } from '@/lib/debugLogger';

export const saveEquipmentHealthHistory = async (equipmentId, equipment, apiConfig) => {
  try {
    let conf = apiConfig || equipment.api_config;
    
    if (!conf) {
      logger.warn('equipmentHealthSync', `Missing API config for equipment ${equipmentId}. Using default values.`);
      conf = {};
    }
    
    const horasOperacao = Number(conf.horas_operacao) || 0;
    const thetaHotspotC = Number(conf.ponto_quente_externo) || 25;
    const temperaturaAmbiente = Number(conf.temperatura_ambiente) || 25;
    const estrategia = conf.estrategia_envelhecimento || 'pior_caso';
    const vidaUtilH = Number(conf.vida_util_isolamento_h) || VIDA_UTIL_ISOLAMENTO_H;

    const calc = calcularSaudeEquipamento({
      horasOperacao,
      thetaHotspotC,
      estrategia,
      vidaUtilH
    });

    const payload = {
      equipment_id: equipmentId,
      timestamp: new Date().toISOString(),
      saude_percent_tempo: Number(calc.tempoModel.saudePercent.toFixed(2)),
      saude_percent_faa: Number(calc.faaModel.saudePercent.toFixed(2)),
      saude_percent_final: Number(calc.saudePercentFinal.toFixed(2)),
      status_final: calc.statusFinal,
      fator_aceleracao: Number(calc.fatorAceleracao.toFixed(4)) || 1.0,
      vida_remanescente_anos_tempo: Number(calc.tempoModel.vidaRemanescenteAnos.toFixed(2)),
      vida_remanescente_anos_faa: Number(calc.faaModel.vidaRemanescenteAnos.toFixed(2)),
      vida_remanescente_anos_final: Number(calc.vidaRemanescenteAnosFinal.toFixed(2)),
      horas_operacao: horasOperacao,
      temperatura_hotspot: thetaHotspotC,
      temperatura_ambiente: temperaturaAmbiente,
      estrategia_usada: calc.estrategiaUsada
    };

    const { error } = await supabase.from('equipment_health_history').insert([payload]);
    
    if (error) {
      logger.error('equipmentHealthSync', `Error saving equipment health history for ${equipmentId}`, error);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('equipmentHealthSync', `Failed to sync equipment health for ${equipmentId}`, err);
    return false;
  }
};

export const getEquipmentHealthHistory = async (equipmentId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('equipment_health_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('equipmentHealthSync', 'Error fetching equipment health history', err);
    return [];
  }
};