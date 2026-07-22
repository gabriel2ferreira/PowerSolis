
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/debugLogger';

export const saveAccelerationFactorHistory = async (equipment_id, fator_aceleracao) => {
  try {
    if (!equipment_id || isNaN(fator_aceleracao) || fator_aceleracao === null) {
      logger.warn('accelerationFactorHistoryService', 'Parâmetros inválidos para saveAccelerationFactorHistory');
      return false;
    }
    
    const { error } = await supabase.from('equipment_acceleration_factor_history').insert([{
      equipment_id,
      fator_aceleracao
    }]);
    
    if (error) throw error;
    
    logger.info('accelerationFactorHistoryService', `Histórico de fator de aceleração salvo para equipamento ${equipment_id}`);
    return true;
  } catch (error) {
    logger.error('accelerationFactorHistoryService', 'Erro ao salvar histórico de fator de aceleração', error);
    return false;
  }
};

export const getAccelerationFactorHistory = async (equipment_id, days = 30) => {
  try {
    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('equipment_acceleration_factor_history')
      .select('timestamp, fator_aceleracao')
      .eq('equipment_id', equipment_id)
      .gte('timestamp', thresholdDate)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    
    logger.info('accelerationFactorHistoryService', `Buscados ${data?.length || 0} registros de histórico de fator de aceleração`);
    return data || [];
  } catch (error) {
    logger.error('accelerationFactorHistoryService', 'Erro ao buscar histórico de fator de aceleração', error);
    return [];
  }
};
