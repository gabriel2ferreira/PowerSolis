import { calcularSaudeEquipamento, VIDA_UTIL_ISOLAMENTO_H, TEMP_REF_C, P_PADRAO, inferirTemperaturaHotspotML } from './equipmentAging.js';
import { getEquipmentStatus } from './equipmentStatus.js';
import { logger } from '@/lib/debugLogger.js';

export const calculateEquipmentHealth = (equipment) => {
  if (!equipment) {
    logger.warn('healthCalculation', 'calculateEquipmentHealth called with null equipment');
    return {
      score: 0, percentage: 0, status: 'Crítico', color: '#ef4444',
      vidaRemanescenteAnos: 0, fatorAceleracao: 1.0, tempoModel: null, faaModel: null, estrategiaUsada: 'pior_caso',
      rawData: {}
    };
  }

  let apiConfig = equipment.api_config || equipment;

  if (!equipment.api_config && typeof equipment.horas_operacao === 'undefined') {
    logger.warn('healthCalculation', `Missing API config for equipment ID: ${equipment.id}. Using default values.`, { equipment });
    apiConfig = {};
  }

  const horas_operacao = parseFloat(apiConfig.horas_operacao) || 0;
  const ponto_quente_externo = parseFloat(apiConfig.ponto_quente_externo) || 25;
  const temperatura_ambiente = parseFloat(apiConfig.temperatura_ambiente) || 25;
  const vida_util_isolamento_h = parseFloat(apiConfig.vida_util_isolamento_h) || VIDA_UTIL_ISOLAMENTO_H;
  const estrategia_envelhecimento = 'pior_caso';
  const tangente_perdas = parseFloat(apiConfig.tangente_perdas) || 0;
  const corrente_primario = parseFloat(apiConfig.corrente_primario) || 0;
  
  const temp_ref = parseFloat(apiConfig.temp_ref) || TEMP_REF_C;
  const vida_ref_anos = parseFloat(apiConfig.vida_ref_anos) || 25;
  const p = parseFloat(apiConfig.p) || parseFloat(apiConfig.p_sensibilidade) || P_PADRAO;

  let thetaHotspotC;

  try {
    if (
      !isNaN(tangente_perdas) && tangente_perdas > 0 &&
      !isNaN(corrente_primario) && corrente_primario > 0 &&
      !isNaN(temperatura_ambiente) &&
      !isNaN(ponto_quente_externo) && ponto_quente_externo > 0
    ) {
      const mlResult = inferirTemperaturaHotspotML({
        tangente_perdas,
        corrente_primario,
        temperatura_ambiente,
        ponto_quente_externo
      });
      thetaHotspotC = mlResult.temperatura_hotspot;
      
      logger.info('healthCalculation', 'ML hotspot inference successful', {
        equipment_id: equipment.id,
        inputs: mlResult.rawInputs,
        result: thetaHotspotC
      });
    } else if (apiConfig.temperatura_hotspot_inferida != null && !isNaN(parseFloat(apiConfig.temperatura_hotspot_inferida))) {
      thetaHotspotC = parseFloat(apiConfig.temperatura_hotspot_inferida);
      logger.info('healthCalculation', 'Using stored temperatura_hotspot_inferida', { value: thetaHotspotC });
    } else {
      thetaHotspotC = ponto_quente_externo;
      logger.warn('healthCalculation', 'ML hotspot missing or parameters invalid. Using ponto_quente_externo as fallback.', { value: thetaHotspotC });
    }
  } catch (error) {
    logger.error('healthCalculation', 'ML hotspot inference failed', error);
    if (apiConfig.temperatura_hotspot_inferida != null && !isNaN(parseFloat(apiConfig.temperatura_hotspot_inferida))) {
      thetaHotspotC = parseFloat(apiConfig.temperatura_hotspot_inferida);
    } else {
      thetaHotspotC = ponto_quente_externo;
    }
  }

  const rawData = {
    horas_operacao,
    ponto_quente_externo,
    temperatura_ambiente,
    vida_util_isolamento_h,
    estrategia_envelhecimento,
    tangente_perdas,
    corrente_primario,
    temp_ref,
    vida_ref_anos,
    p,
    temperatura_hotspot_inferida: thetaHotspotC
  };

  const result = calcularSaudeEquipamento({
    horasOperacao: horas_operacao,
    thetaHotspotC: thetaHotspotC,
    estrategia: estrategia_envelhecimento,
    vidaUtilH: vida_util_isolamento_h,
    tempRef: temp_ref,
    vidaRefAnos: vida_ref_anos,
    p: p
  });

  let finalPercentage = Math.max(0, result.saudePercentFinal);

  let status = 'Crítico';
  let color = '#ef4444'; 
  if (finalPercentage >= 80) {
    status = 'Bom';
    color = '#22c55e'; 
  } else if (finalPercentage >= 50) {
    status = 'Atenção';
    color = '#eab308'; 
  }

  return {
    score: finalPercentage,
    percentage: finalPercentage,
    status: status,
    color: color,
    vidaRemanescenteAnos: result.vidaRemanescenteAnosFinal || 0,
    fatorAceleracao: result.fatorAceleracao || 1.0,
    tempoModel: result.tempoModel,
    faaModel: result.faaModel,
    estrategiaUsada: result.estrategiaUsada,
    rawData
  };
};

export const countEquipmentByHealth = (equipments) => {
  const counts = { good: 0, attention: 0, critical: 0, total: 0 };
  if (!Array.isArray(equipments)) return counts;
  
  equipments.forEach(eq => {
    const healthData = calculateEquipmentHealth(eq);
    const eqWithHealth = { ...eq, health: healthData };
    
    const { status } = getEquipmentStatus(eqWithHealth);
    
    if (status === 'Bom') counts.good++;
    else if (status === 'Atenção') counts.attention++;
    else if (status === 'Crítico') counts.critical++;
    counts.total++;
  });
  
  return counts;
};