/**
 * Comprehensive logging utility for Gemini integration
 */
export const geminiLogger = {
  isDev: true, // Set to import.meta.env.DEV in real app

  log: (message, data = null, level = 'info') => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[Gemini ${level.toUpperCase()}] ${timestamp}:`;
    
    if (level === 'error') {
      console.error(logPrefix, message, data || '');
    } else if (level === 'warn') {
      console.warn(logPrefix, message, data || '');
    } else {
      console.log(logPrefix, message, data || '');
    }
  },

  logAPIKeyStatus: (maskedKey) => {
    geminiLogger.log('API Key Status', { key: maskedKey || 'MISSING' });
  },

  logRequestPayload: (payload, size) => {
    geminiLogger.log('Request Payload Prepared', { 
      sizeBytes: size,
      partCount: payload?.contents?.[0]?.parts?.length || 0,
      hasInlineData: !!payload?.contents?.[0]?.parts?.find(p => p.inlineData)
    });
  },

  logGeminiResponse: (response) => {
    geminiLogger.log('Gemini Raw Response', response);
  },

  logError: (error, context = '') => {
    geminiLogger.log(`Error in ${context}`, {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN'
    }, 'error');
  },

  logRetryAttempt: (attempt, reason, delay) => {
    geminiLogger.log('Retry Attempt', {
      attempt,
      reason,
      nextDelay: delay
    }, 'warn');
  },

  logValidationStep: (step, result) => {
    geminiLogger.log(`Validation: ${step}`, {
      success: result.valid,
      details: result.message || 'OK'
    });
  }
};