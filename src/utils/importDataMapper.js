import { supabase } from '@/lib/customSupabaseClient';

export const mapImportDataToEquipment = (importData) => ({
  name: importData.name,
  equipment_type_id: importData.equipment_type_id,
  status: importData.status || 'Desconhecido',
  location_name: importData.location_name,
  city: importData.city,
  state: importData.state,
  installation_date: importData.installation_date ? new Date(importData.installation_date).toISOString() : null,
  voltage_level: importData.voltage_level,
  phase: importData.phase,
  observations: importData.observations
});

export const mapImportDataToCustomFields = (importData) => ({
  manufacturer: importData.manufacturer,
  model: importData.model,
  serial_number: importData.serial_number
});

export const mapImportDataToApiConfig = (importData) => ({
  tangente_perdas: importData.tangente_perdas,
  corrente_primario: importData.corrente_primario,
  temperatura_ambiente: importData.temperatura_ambiente,
  horas_operacao: importData.horas_operacao,
  temp_ref: importData.temp_ref,
  vida_ref_anos: importData.vida_ref_anos,
  p: importData.p,
  ponto_quente_externo: importData.ponto_quente_externo
});

export const validateAndSaveImportedData = async (mappedData) => {
  const { equipment, customFields, apiConfig } = mappedData;
  
  try {
    // 1. Save Equipment
    const { data: eqData, error: eqErr } = await supabase
      .from('equipments')
      .insert(equipment)
      .select()
      .single();
      
    if (eqErr) throw eqErr;

    // 2. Save Custom Fields
    if (customFields) {
      const cfInserts = Object.keys(customFields)
        .filter(key => customFields[key])
        .map(key => ({
          equipment_id: eqData.id,
          field_name: key,
          field_type: 'text',
          observations: String(customFields[key])
        }));
        
      if (cfInserts.length > 0) {
        await supabase.from('custom_fields').insert(cfInserts);
      }
    }

    // 3. Save API Config - FIXED: Check for existing record to prevent Duplicate Key Constraint error
    if (apiConfig) {
      const cleanApiConfig = Object.fromEntries(
        Object.entries(apiConfig).filter(([_, v]) => v != null)
      );
      if (Object.keys(cleanApiConfig).length > 0) {
        // Safe UPSERT logic manually applied to guarantee no constraint violations
        const { data: existingConfig } = await supabase
          .from('equipment_api_config')
          .select('id')
          .eq('equipment_id', eqData.id)
          .maybeSingle();

        if (existingConfig) {
          const { error: updateErr } = await supabase
            .from('equipment_api_config')
            .update({ ...cleanApiConfig, updated_at: new Date().toISOString() })
            .eq('id', existingConfig.id);
            
          if (updateErr) console.error('Error updating existing API config:', updateErr);
        } else {
          const { error: insertErr } = await supabase
            .from('equipment_api_config')
            .insert({ equipment_id: eqData.id, ...cleanApiConfig });
            
          if (insertErr) console.error('Error inserting new API config:', insertErr);
        }
      }
    }
    
    return { success: true, data: eqData };
  } catch (error) {
    console.error('Error saving imported data:', error);
    return { success: false, error };
  }
};