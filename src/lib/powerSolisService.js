/**
 * Power Solis API Service
 * Handles calculations for hotspot temperature and equipment lifespan
 */

/**
 * Calculate hotspot temperature using Power Solis API
 * @param {number} tangente_perdas - Loss tangent value
 * @param {number} corrente_primario - Primary current in Amperes
 * @param {number} temperatura_ambiente - Ambient temperature in Celsius
 * @param {string} apiUrl - Base URL of the Power Solis API
 * @returns {Promise<number>} Calculated hotspot temperature
 */
export async function calculateHotspot(tangente_perdas, corrente_primario, temperatura_ambiente, apiUrl) {
  try {
    console.log('[Power Solis API] Calling hotspot calculation:', {
      tangente_perdas,
      corrente_primario,
      temperatura_ambiente,
      apiUrl
    });

    const response = await fetch(`${apiUrl}/inferir-hotspot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tangente_perdas,
        corrente_primario,
        temperatura_ambiente
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Power Solis API] Hotspot calculation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Falha ao calcular hotspot: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Power Solis API] Hotspot calculation response:', data);

    // Extract hotspot value from response (adjust based on actual API response structure)
    const hotspotValue = data.hotspot || data.temperatura_hotspot || data.value;
    
    if (hotspotValue === undefined || hotspotValue === null) {
      console.error('[Power Solis API] Invalid hotspot response:', data);
      throw new Error('Resposta inválida da API: valor de hotspot não encontrado');
    }

    return hotspotValue;
  } catch (error) {
    console.error('[Power Solis API] Error calculating hotspot:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão com a API Power Solis. Verifique a URL e tente novamente.');
    }
    throw error;
  }
}

/**
 * Calculate equipment lifespan loss using Power Solis API
 * @param {number} temperatura_hotspot - Hotspot temperature in Celsius
 * @param {number} horas_operacao - Operating hours
 * @param {number} temp_ref - Reference temperature (default: 85)
 * @param {number} vida_ref_anos - Reference lifespan in years (default: 25)
 * @param {number} p - P parameter (default: 8)
 * @param {string} apiUrl - Base URL of the Power Solis API
 * @returns {Promise<number>} Calculated lifespan loss percentage
 */
export async function calculateVidaUtil(temperatura_hotspot, horas_operacao, temp_ref, vida_ref_anos, p, apiUrl) {
  try {
    console.log('[Power Solis API] Calling lifespan calculation:', {
      temperatura_hotspot,
      horas_operacao,
      temp_ref,
      vida_ref_anos,
      p,
      apiUrl
    });

    const response = await fetch(`${apiUrl}/perda-vida`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        temperatura_hotspot,
        horas_operacao,
        temp_ref,
        vida_ref_anos,
        p
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Power Solis API] Lifespan calculation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Falha ao calcular perda de vida: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Power Solis API] Lifespan calculation response:', data);

    // Extract vida util value from response (adjust based on actual API response structure)
    const vidaUtilValue = data.perda_vida || data.vida_util || data.value;
    
    if (vidaUtilValue === undefined || vidaUtilValue === null) {
      console.error('[Power Solis API] Invalid lifespan response:', data);
      throw new Error('Resposta inválida da API: valor de perda de vida não encontrado');
    }

    return vidaUtilValue;
  } catch (error) {
    console.error('[Power Solis API] Error calculating lifespan:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão com a API Power Solis. Verifique a URL e tente novamente.');
    }
    throw error;
  }
}

/**
 * Calculate and save equipment metrics (hotspot and vida util)
 * @param {string} equipmentId - Equipment UUID
 * @param {object} apiConfig - API configuration object
 * @param {object} supabaseClient - Supabase client instance
 * @returns {Promise<object>} Result object with success status and values or error
 */
export async function calculateAndSaveMetrics(equipmentId, apiConfig, supabaseClient) {
  try {
    console.log('[Power Solis Service] Starting metrics calculation for equipment:', equipmentId);

    // Validate required fields
    const requiredFields = ['tangente_perdas', 'corrente_primario', 'temperatura_ambiente', 'horas_operacao', 'api_base_url'];
    const missingFields = requiredFields.filter(field => !apiConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    // Set default values for optional parameters
    const temp_ref = apiConfig.temp_ref || 85;
    const vida_ref_anos = apiConfig.vida_ref_anos || 25;
    const p = apiConfig.p || 8;

    // Calculate hotspot temperature
    const hotspotValue = await calculateHotspot(
      apiConfig.tangente_perdas,
      apiConfig.corrente_primario,
      apiConfig.temperatura_ambiente,
      apiConfig.api_base_url
    );

    // Calculate lifespan loss
    const vidaUtilValue = await calculateVidaUtil(
      hotspotValue,
      apiConfig.horas_operacao,
      temp_ref,
      vida_ref_anos,
      p,
      apiConfig.api_base_url
    );

    const timestamp = new Date().toISOString();

    // Save metrics to database
    const metricsToSave = [
      {
        equipment_id: equipmentId,
        metric_type: 'hotspot',
        metric_value: hotspotValue,
        metric_unit: '°C',
        timestamp,
        api_response: {
          tangente_perdas: apiConfig.tangente_perdas,
          corrente_primario: apiConfig.corrente_primario,
          temperatura_ambiente: apiConfig.temperatura_ambiente,
          result: hotspotValue
        }
      },
      {
        equipment_id: equipmentId,
        metric_type: 'vida_util',
        metric_value: vidaUtilValue,
        metric_unit: '%',
        timestamp,
        api_response: {
          temperatura_hotspot: hotspotValue,
          horas_operacao: apiConfig.horas_operacao,
          temp_ref,
          vida_ref_anos,
          p,
          result: vidaUtilValue
        }
      },
      {
        equipment_id: equipmentId,
        metric_type: 'corrente',
        metric_value: apiConfig.corrente_primario,
        metric_unit: 'A',
        timestamp,
        api_response: { source: 'api_config' }
      },
      {
        equipment_id: equipmentId,
        metric_type: 'temperatura_ambiente',
        metric_value: apiConfig.temperatura_ambiente,
        metric_unit: '°C',
        timestamp,
        api_response: { source: 'api_config' }
      },
      {
        equipment_id: equipmentId,
        metric_type: 'tangente_perdas',
        metric_value: apiConfig.tangente_perdas,
        metric_unit: '',
        timestamp,
        api_response: { source: 'api_config' }
      }
    ];

    const { error: metricsError } = await supabaseClient
      .from('equipment_metrics')
      .insert(metricsToSave);

    if (metricsError) {
      console.error('[Power Solis Service] Error saving metrics:', metricsError);
      throw new Error(`Erro ao salvar métricas: ${metricsError.message}`);
    }

    // Update last_calculation timestamp in api_config
    const { error: configError } = await supabaseClient
      .from('equipment_api_config')
      .update({ last_calculation: timestamp })
      .eq('equipment_id', equipmentId);

    if (configError) {
      console.warn('[Power Solis Service] Error updating config timestamp:', configError);
      // Don't fail the entire operation for this
    }

    console.log('[Power Solis Service] Metrics saved successfully:', {
      hotspot: hotspotValue,
      vidaUtil: vidaUtilValue
    });

    return {
      success: true,
      hotspot: hotspotValue,
      vidaUtil: vidaUtilValue
    };

  } catch (error) {
    console.error('[Power Solis Service] Error in calculateAndSaveMetrics:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao calcular métricas'
    };
  }
}