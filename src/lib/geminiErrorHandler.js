import { GEMINI_CONFIG } from './geminiConfig';

/**
 * Utilities for handling and parsing Gemini API errors
 */

export const parseGeminiError = (response) => {
  if (!response) return "Unknown error occurred";
  
  // Try parsing standard Google API error format
  if (response.error) {
    return response.error.message || response.error.status || JSON.stringify(response.error);
  }
  
  // Try parsing candidate filters (safety blocks)
  if (response.promptFeedback?.blockReason) {
    return `Blocked by safety filters: ${response.promptFeedback.blockReason}`;
  }

  return JSON.stringify(response);
};

export const getDetailedErrorMessage = (error, language = 'pt-BR') => {
  const msg = error.message?.toLowerCase() || '';
  const isPt = language === 'pt-BR';

  if (msg.includes('quota') || msg.includes('429')) {
    return {
      title: isPt ? 'Cota Excedida' : 'Quota Exceeded',
      message: isPt 
        ? 'O limite de uso da API Gemini foi atingido. Tente novamente mais tarde.' 
        : 'Gemini API quota exceeded. Please try again later.',
      retryable: true
    };
  }

  if (msg.includes('timeout') || error.name === 'TimeoutError') {
    return {
      title: isPt ? 'Tempo Esgotado' : 'Timeout',
      message: isPt 
        ? 'O processamento demorou muito. O documento pode ser muito complexo.' 
        : 'Processing timed out. The document might be too complex.',
      retryable: true
    };
  }

  if (msg.includes('key') || msg.includes('401') || msg.includes('403')) {
    return {
      title: isPt ? 'Erro de Autenticação' : 'Authentication Error',
      message: isPt 
        ? 'Chave de API inválida ou expirada. Contate o administrador.' 
        : 'Invalid or expired API key. Contact administrator.',
      retryable: false
    };
  }

  if (msg.includes('payload') || msg.includes('size') || msg.includes('413')) {
    return {
      title: isPt ? 'Arquivo Muito Grande' : 'File Too Large',
      message: isPt 
        ? 'O arquivo ou payload excede os limites da API Gemini.' 
        : 'File or payload exceeds Gemini API limits.',
      retryable: false
    };
  }

  // Default
  return {
    title: isPt ? 'Erro no Processamento' : 'Processing Error',
    message: isPt 
      ? `Ocorreu um erro ao processar o documento: ${error.message}` 
      : `An error occurred while processing the document: ${error.message}`,
    retryable: shouldRetry(error)
  };
};

export const shouldRetry = (error) => {
  const msg = error.message?.toLowerCase() || '';
  const status = error.status || 0;

  // Retry on server errors, rate limits, timeouts
  if (status >= 500) return true;
  if (status === 429) return true;
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch')) return true;
  
  return false;
};

export const getRetryDelay = (attemptNumber) => {
  const delays = GEMINI_CONFIG.RETRY_DELAYS;
  return delays[Math.min(attemptNumber, delays.length - 1)] || 1000;
};