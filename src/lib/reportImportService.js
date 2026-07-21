import { supabase } from '@/lib/customSupabaseClient';
import { pdfImportDebugger } from '@/lib/pdfImportDebugger';

/**
 * Valida um arquivo PDF antes do upload
 */
export const validatePDFFile = (file) => {
  pdfImportDebugger.logSectionStart('PDF FILE VALIDATION');
  
  // 1. Verificar se o arquivo existe
  if (!file) {
    pdfImportDebugger.logValidationStep('File exists check', false, 'No file provided');
    pdfImportDebugger.logSectionEnd('PDF FILE VALIDATION', false);
    return {
      valid: false,
      error: 'Nenhum arquivo selecionado'
    };
  }
  pdfImportDebugger.logValidationStep('File exists check', true);
  pdfImportDebugger.logFileInfo(file);

  // 2. Verificar tipo MIME
  if (file.type !== 'application/pdf') {
    pdfImportDebugger.logValidationStep('MIME type check', false, { 
      expected: 'application/pdf', 
      received: file.type 
    });
    pdfImportDebugger.logSectionEnd('PDF FILE VALIDATION', false);
    return {
      valid: false,
      error: 'Arquivo não é um PDF válido'
    };
  }
  pdfImportDebugger.logValidationStep('MIME type check', true, { type: file.type });

  // 3. Verificar tamanho (máximo 20MB)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    pdfImportDebugger.logValidationStep('File size check', false, {
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      maxSize: '20 MB'
    });
    pdfImportDebugger.logSectionEnd('PDF FILE VALIDATION', false);
    return {
      valid: false,
      error: `Arquivo muito grande (máx 20MB). Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
  pdfImportDebugger.logValidationStep('File size check', true, { 
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB` 
  });

  pdfImportDebugger.logSectionEnd('PDF FILE VALIDATION', true);
  return { valid: true };
};

/**
 * Converte um arquivo PDF para base64
 */
export const convertPDFToBase64 = (file) => {
  pdfImportDebugger.logSectionStart('BASE64 CONVERSION');
  pdfImportDebugger.logFileInfo(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let progressLogged = false;

    reader.onprogress = (event) => {
      if (event.lengthComputable && !progressLogged) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        pdfImportDebugger.logProgress('Reading file', 'File reading in progress', percentComplete);
        progressLogged = true;
      }
    };

    reader.onload = () => {
      try {
        pdfImportDebugger.logProgress('Extracting base64', 'Processing base64 data');
        
        const result = reader.result;
        if (!result || typeof result !== 'string') {
          throw new Error('FileReader result is invalid');
        }

        const base64String = result.split(',')[1];
        
        if (!base64String) {
          throw new Error('Failed to extract base64 from FileReader result');
        }

        // Validar base64
        pdfImportDebugger.logProgress('Validating base64', 'Checking base64 format');
        
        // Verificar se não está vazio
        if (base64String.length === 0) {
          throw new Error('Base64 string is empty');
        }
        pdfImportDebugger.logValidationStep('Base64 not empty', true, { 
          length: base64String.length 
        });

        // Verificar formato base64 válido
        const base64Regex = /^[A-Za-z0-9+/=]*$/;
        if (!base64Regex.test(base64String)) {
          throw new Error('Base64 inválido - contém caracteres inválidos');
        }
        pdfImportDebugger.logValidationStep('Base64 format valid', true);

        // Verificar tamanho razoável (mínimo 100 bytes, máximo ~27MB em base64)
        const minLength = 100;
        const maxLength = 27 * 1024 * 1024 * 1.33; // ~20MB file = ~27MB base64
        
        if (base64String.length < minLength) {
          throw new Error(`Base64 muito curto (${base64String.length} chars) - arquivo pode estar corrompido`);
        }
        
        if (base64String.length > maxLength) {
          throw new Error(`Base64 muito grande (${base64String.length} chars) - arquivo excede 20MB`);
        }
        
        pdfImportDebugger.logValidationStep('Base64 length reasonable', true, {
          length: base64String.length,
          min: minLength,
          max: maxLength
        });

        // Log informações do base64
        pdfImportDebugger.logBase64Info(base64String);

        pdfImportDebugger.logSectionEnd('BASE64 CONVERSION', true);
        
        resolve({
          base64: base64String,
          fileName: file.name,
          fileSize: file.size
        });
      } catch (error) {
        pdfImportDebugger.logError('BASE64_CONVERSION', error);
        pdfImportDebugger.logSectionEnd('BASE64 CONVERSION', false);
        reject(new Error(`Erro ao codificar arquivo em base64: ${error.message}`));
      }
    };

    reader.onerror = () => {
      const error = reader.error || new Error('Unknown FileReader error');
      pdfImportDebugger.logError('FILE_READER', error);
      pdfImportDebugger.logSectionEnd('BASE64 CONVERSION', false);
      reject(new Error(`Erro ao ler arquivo: ${error.message}`));
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      pdfImportDebugger.logError('FILE_READER_START', error);
      pdfImportDebugger.logSectionEnd('BASE64 CONVERSION', false);
      reject(new Error(`Erro ao iniciar leitura do arquivo: ${error.message}`));
    }
  });
};

/**
 * Valida a resposta da Edge Function
 */
const validateFunctionResponse = (response) => {
  pdfImportDebugger.logProgress('Response validation', 'Validating Edge Function response');
  
  if (!response) {
    pdfImportDebugger.logValidationStep('Response exists', false, 'Response is null/undefined');
    return { valid: false, error: 'Resposta vazia do servidor' };
  }

  if (typeof response !== 'object') {
    pdfImportDebugger.logValidationStep('Response is object', false, { 
      type: typeof response 
    });
    return { valid: false, error: 'Resposta não é um objeto válido' };
  }

  const structure = {
    hasData: 'data' in response,
    hasError: 'error' in response,
    hasSuccess: 'success' in response,
    keys: Object.keys(response)
  };
  
  pdfImportDebugger.logValidationStep('Response structure', true, structure);
  return { valid: true };
};

/**
 * Chama a Edge Function para analisar o PDF com retry logic
 */
export const analyzePDFReport = async (pdfBase64, fileName, maxRetries = 3) => {
  pdfImportDebugger.logSectionStart('GEMINI PDF ANALYSIS');
  
  pdfImportDebugger.logProgress('Setup', 'Initializing analysis', 0);
  console.log('Configuration:', {
    function: 'analyze-pdf-report',
    fileName,
    base64Length: pdfBase64.length,
    approximateSizeMB: (pdfBase64.length * 0.75 / 1024 / 1024).toFixed(2),
    maxRetries,
    timeoutPerAttempt: '4 minutes'
  });

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      pdfImportDebugger.logRetry(attempt, maxRetries, lastError?.message || 'First attempt');
      pdfImportDebugger.logProgress('API Call', `Starting attempt ${attempt}`, 
        Math.round((attempt - 1) / maxRetries * 100));

      const startTime = Date.now();

      // Preparar payload
      const payload = {
        pdf_base64: pdfBase64,
        pdfBase64: pdfBase64,
        fileName: fileName
      };

      pdfImportDebugger.logAPICall('analyze-pdf-report', payload);

      // Criar timeout promise (240 segundos = 4 minutos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout ao processar PDF - a análise demorou mais de 4 minutos'));
        }, 240000);
      });

      // Criar função promise
      const functionPromise = supabase.functions.invoke('analyze-pdf-report', {
        body: payload
      });

      // Race entre timeout e função
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => ({ error: new Error('Timeout') }))
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      pdfImportDebugger.logProgress('Response received', `Response time: ${duration}s`);

      // Tratar erro da chamada
      if (error) {
        pdfImportDebugger.logError('EDGE_FUNCTION_ERROR', error, {
          attempt,
          duration: `${duration}s`
        });
        
        lastError = error;
        
        // Determinar se deve tentar novamente
        const errorMessage = error.message || '';
        const isRetryable = 
          errorMessage.includes('timeout') ||
          errorMessage.includes('Timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('NetworkError');

        if (!isRetryable || attempt === maxRetries) {
          // Criar mensagem de erro amigável
          let userMessage = 'Erro ao analisar o PDF. ';
          
          if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
            userMessage = 'Timeout ao processar PDF - a análise demorou muito tempo (mais de 4 minutos). Tente um PDF menor ou tente novamente.';
          } else if (errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY')) {
            userMessage = 'Erro de configuração da API. Entre em contato com o suporte técnico.';
          } else if (errorMessage.includes('Invalid PDF') || errorMessage.includes('inválido')) {
            userMessage = 'O arquivo PDF não pôde ser processado. Verifique se o arquivo não está corrompido ou protegido por senha.';
          } else {
            userMessage += errorMessage;
          }

          pdfImportDebugger.logSectionEnd('GEMINI PDF ANALYSIS', false);
          throw new Error(userMessage);
        }

        // Aguardar antes de tentar novamente (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        pdfImportDebugger.logProgress('Backoff', `Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Validar estrutura da resposta
      const validation = validateFunctionResponse(data);
      
      if (!validation.valid) {
        const error = new Error(`Erro ao processar resposta: ${validation.error}`);
        pdfImportDebugger.logError('RESPONSE_VALIDATION', error);
        throw error;
      }

      pdfImportDebugger.logAPIResponse('analyze-pdf-report', data);

      // Verificar se houve erro na resposta
      if (data.error || !data.success) {
        const errorMsg = data.message || data.error || 'Erro desconhecido na análise';
        const error = new Error(errorMsg);
        pdfImportDebugger.logError('API_ERROR_RESPONSE', error);
        throw error;
      }

      // Verificar se tem dados
      if (!data.data) {
        const error = new Error('Resposta vazia do servidor - nenhum dado foi extraído do PDF');
        pdfImportDebugger.logError('EMPTY_DATA', error);
        throw error;
      }

      pdfImportDebugger.logProgress('Success', 'Analysis completed successfully', 100);
      console.log('Extracted data summary:', {
        fields: Object.keys(data.data),
        equipmentName: data.data.equipment_name || 'N/A',
        customFieldsCount: data.data.custom_fields?.length || 0
      });

      pdfImportDebugger.logSectionEnd('GEMINI PDF ANALYSIS', true);

      return {
        success: true,
        data: data.data,
        metadata: data.metadata || {
          fileName,
          processedAt: new Date().toISOString(),
          duration: `${duration}s`
        }
      };

    } catch (error) {
      pdfImportDebugger.logError('ATTEMPT_FAILED', error, { 
        attempt, 
        maxRetries 
      });
      
      lastError = error;

      if (attempt === maxRetries) {
        pdfImportDebugger.logSectionEnd('GEMINI PDF ANALYSIS', false);
        break;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      pdfImportDebugger.logProgress('Retry backoff', `Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  const errorMessage = lastError?.message || 'Falha ao analisar PDF após múltiplas tentativas';
  pdfImportDebugger.logError('ALL_RETRIES_FAILED', new Error(errorMessage), { 
    totalAttempts: maxRetries 
  });
  throw new Error(errorMessage);
};

/**
 * Valida os dados extraídos do PDF
 */
export const validateExtractedData = (data) => {
  pdfImportDebugger.logSectionStart('EXTRACTED DATA VALIDATION');

  if (!data || typeof data !== 'object') {
    pdfImportDebugger.logValidationStep('Data is object', false, { 
      type: typeof data 
    });
    pdfImportDebugger.logSectionEnd('EXTRACTED DATA VALIDATION', false);
    return {
      valid: false,
      error: 'Dados extraídos estão em formato inválido'
    };
  }

  const fields = Object.keys(data);
  pdfImportDebugger.logValidationStep('Data has fields', true, { 
    fields, 
    count: fields.length 
  });

  // Verificar se pelo menos alguns campos foram extraídos
  const hasAnyData = Object.values(data).some(value => 
    value !== null && value !== undefined && value !== ''
  );

  if (!hasAnyData) {
    pdfImportDebugger.logValidationStep('Data has values', false);
    pdfImportDebugger.logSectionEnd('EXTRACTED DATA VALIDATION', false);
    return {
      valid: false,
      error: 'Nenhum dado foi extraído do PDF. Verifique se o arquivo contém informações legíveis.'
    };
  }

  pdfImportDebugger.logValidationStep('Data has values', true, {
    nonEmptyFields: fields.filter(key => {
      const value = data[key];
      return value !== null && value !== undefined && value !== '';
    })
  });

  pdfImportDebugger.logSectionEnd('EXTRACTED DATA VALIDATION', true);
  return { valid: true };
};

/**
 * Fluxo completo de importação de relatório com timeout wrapper
 */
export const importPDFReport = async (file, onProgress) => {
  const overallTimeout = 240000; // 4 minutes (240 seconds) total timeout
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout ao processar PDF - o processo completo demorou mais de 4 minutos'));
    }, overallTimeout);
  });

  const processPromise = (async () => {
    try {
      // 1. Validar arquivo
      onProgress?.({ step: 'validating', message: 'Validando arquivo...' });
      pdfImportDebugger.logProgress('Import flow', 'Starting validation');
      
      const validation = validatePDFFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Converter para base64
      onProgress?.({ step: 'converting', message: 'Convertendo PDF...' });
      pdfImportDebugger.logProgress('Import flow', 'Converting to base64');
      
      const { base64, fileName } = await convertPDFToBase64(file);

      // 3. Analisar com Gemini
      onProgress?.({ step: 'analyzing', message: 'Analisando relatório com IA...' });
      pdfImportDebugger.logProgress('Import flow', 'Analyzing with Gemini');
      
      const result = await analyzePDFReport(base64, fileName);

      // 4. Validar dados extraídos
      onProgress?.({ step: 'validating-data', message: 'Validando dados extraídos...' });
      pdfImportDebugger.logProgress('Import flow', 'Validating extracted data');
      
      const dataValidation = validateExtractedData(result.data);
      if (!dataValidation.valid) {
        throw new Error(dataValidation.error);
      }

      onProgress?.({ step: 'complete', message: 'Análise concluída!' });
      pdfImportDebugger.logProgress('Import flow', 'Import complete', 100);
      
      return {
        success: true,
        data: result.data,
        metadata: result.metadata
      };

    } catch (error) {
      pdfImportDebugger.logError('IMPORT_FLOW', error);
      throw error;
    }
  })();

  try {
    return await Promise.race([processPromise, timeoutPromise]);
  } catch (error) {
    pdfImportDebugger.logError('IMPORT_TIMEOUT', error);
    throw error;
  }
};