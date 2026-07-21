import { supabase } from '@/lib/customSupabaseClient';
import { pdfLogger } from './pdfLogger';
import { edgeFunctionLogger } from './edgeFunctionLogger';
import { APIError, NetworkError } from './errorHandler';

/**
 * Utility for managing API calls to extraction services
 * Enhanced with comprehensive logging and error handling
 */
export const DataExtractor = {
  /**
   * Calls the extraction edge function with detailed logging
   * @param {string} pdfData - Base64 encoded PDF data
   * @param {string} fileName - Name of the file
   * @param {AbortSignal} [signal] - Optional abort signal
   * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
   */
  extractPDFData: async (pdfData, fileName, signal) => {
    const startTime = Date.now();
    
    edgeFunctionLogger.logAPICall('Supabase Edge Function', 'extract-pdf-data', { 
      fileName,
      dataLength: pdfData.length,
      dataPreview: pdfData.substring(0, 100) + '...'
    });
    
    pdfLogger.logAPICall('extract-pdf-data', pdfData.length);
    
    try {
      if (!pdfData || typeof pdfData !== 'string') {
        throw new APIError(400, 'Invalid PDF data: must be base64 string', 'Dados PDF inválidos');
      }

      if (pdfData.length === 0) {
        throw new APIError(400, 'Empty PDF data', 'Dados PDF vazios');
      }

      edgeFunctionLogger.logRequest({ method: 'POST', url: 'extract-pdf-data' }, {
        payloadSize: JSON.stringify({ pdfBase64: pdfData, fileName }).length,
        fileName
      });

      const { data, error } = await supabase.functions.invoke('extract-pdf-data', {
        body: { 
          pdfBase64: pdfData, 
          fileName,
          // Instruct function to grab comprehensive equipment details
          extractComprehensiveFields: true 
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;

      if (error) {
        edgeFunctionLogger.logError(error, { 
          operation: 'Supabase function invoke',
          fileName,
          duration
        });
        
        throw new APIError(
          500, 
          error.message || 'Edge function invocation failed', 
          'Erro ao chamar função de extração'
        );
      }

      if (!data) {
        const err = new APIError(500, 'No data returned from edge function', 'Nenhum dado retornado');
        edgeFunctionLogger.logError(err, { fileName, duration });
        throw err;
      }

      console.log('Edge Function Response:', data);

      if (data.error || data.success === false) {
        const errorMsg = data.error || data.details || 'Unknown error from extraction service';
        edgeFunctionLogger.logError(new Error(errorMsg), { 
          fileName, 
          duration,
          responseData: data 
        });
        
        let userMessage = 'Erro na extração de dados';
        if (errorMsg.includes('timeout')) {
          userMessage = 'Tempo limite excedido ao processar o PDF';
        } else if (errorMsg.includes('quota')) {
          userMessage = 'Limite de API excedido. Tente novamente mais tarde.';
        } else if (errorMsg.includes('API key')) {
          userMessage = 'Erro de configuração da API. Contate o administrador.';
        } else if (errorMsg.includes('Base64')) {
          userMessage = 'Erro ao processar arquivo PDF. Verifique se o arquivo está corrompido.';
        }
        
        throw new APIError(400, errorMsg, userMessage);
      }

      if (!data.data) {
        const err = new APIError(500, 'Response missing data field', 'Resposta sem dados extraídos');
        edgeFunctionLogger.logError(err, { fileName, duration, response: data });
        throw err;
      }

      // Pre-map extracted data to standard equipments table fields if possible
      const extracted = data.data;
      
      // Standardizing common metrics into equipment mappings
      extracted.equipment_name = extracted.equipment_name || extracted.sapid || extracted.name;
      extracted.voltage_level = extracted.voltage_level || extracted.max_voltage || extracted.nominal_voltage;
      extracted.temperature = extracted.temperature || extracted.technicalData?.temperature || extracted.oil_temperature;
      extracted.city = extracted.city || extracted.location?.city;
      extracted.state = extracted.state || extracted.location?.state;
      extracted.phase = extracted.phase || extracted.electricalData?.phase;

      const fieldsCount = Object.keys(extracted).length;
      const extractedFields = Object.keys(extracted);
      
      edgeFunctionLogger.logResponse(200, extracted, {
        fileName,
        duration,
        fieldsExtracted: extractedFields,
        fieldsCount
      });
      
      pdfLogger.logExtraction(fileName, duration, fieldsCount);

      console.log('Extracted Data Structure:', {
        fields: extractedFields,
        values: extracted
      });

      return { success: true, data: extracted };

    } catch (err) {
      const duration = Date.now() - startTime;
      
      pdfLogger.logError(fileName, 'API_CALL', err);
      edgeFunctionLogger.logError(err, {
        operation: 'extractPDFData',
        fileName,
        duration,
        errorType: err.constructor.name
      });
      
      if (err instanceof APIError) {
        throw err;
      }
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError' || err.name === 'NetworkError') {
        throw new NetworkError(err);
      }

      if (err.name === 'AbortError') {
        throw new APIError(408, 'Request aborted by user', 'Operação cancelada');
      }

      throw new APIError(
        500, 
        err.message || 'Unknown error in extraction', 
        'Erro desconhecido na extração de dados'
      );
    }
  }
};