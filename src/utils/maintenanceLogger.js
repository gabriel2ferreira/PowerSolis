import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/debugLogger';

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return 'Sistema';
    
    return user.user_metadata?.name || user.email || 'Sistema';
  } catch (err) {
    logger.error('maintenanceLogger', 'Error getting current user', err);
    return 'Sistema';
  }
};

export const logMaintenanceHistory = async ({
  equipment_id,
  tipo_manutencao,
  descricao,
  tecnico_responsavel,
  observacoes
}) => {
  try {
    const payload = {
      equipment_id,
      data_manutencao: new Date().toISOString(),
      tipo_manutencao,
      descricao,
      tecnico_responsavel,
      status_manutencao: 'Concluído',
      observacoes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('maintenance_history').insert([payload]);
    
    if (error) {
      logger.error('maintenanceLogger', 'Error inserting into maintenance_history', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    logger.error('maintenanceLogger', 'Failed to log maintenance history', err);
    return false;
  }
};