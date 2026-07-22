
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/debugLogger';

export const saveHotspotHistory = async (equipment_id, temperatura_hotspot) => {
  try {
    if (!equipment_id || isNaN(temperatura_hotspot) || temperatura_hotspot === null) {
      logger.warn('hotspotHistoryService', 'Parâmetros inválidos para saveHotspotHistory');
      return false;
    }
    
    const { error } = await supabase.from('equipment_hotspot_history').insert([{
      equipment_id,
      temperatura_hotspot
    }]);
    
    if (error) throw error;
    
    logger.info('hotspotHistoryService', `Histórico de hotspot salvo para equipamento ${equipment_id}`);
    return true;
  } catch (error) {
    logger.error('hotspotHistoryService', 'Erro ao salvar histórico de hotspot', error);
    return false;
  }
};

export const getHotspotHistory = async (equipment_id, days = 30) => {
  try {
    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('equipment_hotspot_history')
      .select('timestamp, temperatura_hotspot')
      .eq('equipment_id', equipment_id)
      .gte('timestamp', thresholdDate)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    
    logger.info('hotspotHistoryService', `Buscados ${data?.length || 0} registros de histórico de hotspot`);
    return data || [];
  } catch (error) {
    logger.error('hotspotHistoryService', 'Erro ao buscar histórico de hotspot', error);
    return [];
  }
};
