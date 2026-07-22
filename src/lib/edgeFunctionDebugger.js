/**
 * Comprehensive debugging and logging utility for Edge Functions
 * Provides structured logging with sensitive data masking
 */

export const edgeFunctionDebugger = {
  /**
   * Masks sensitive data like API keys, tokens, and secrets
   */
  maskSensitiveData: (data) => {
    if (!data) return data;
    
    if (typeof data === 'string') {
      // Mask API keys (show first 4 and last 4 chars)
      if (data.length > 20) {
        return `${data.substring(0, 4)}...${data.substring(data.length - 4)}`;
      }
      return data;
    }
    
    if (typeof data === 'object') {
      const masked = Array.isArray(data) ? [...data] : { ...data };
      
      for (const key in masked) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('key') || 
            lowerKey.includes('secret') || 
            lowerKey.includes('token') || 
            lowerKey.includes('password')) {
          masked[key] = edgeFunctionDebugger.maskSensitiveData(masked[key]);
        } else if (typeof masked[key] === 'object') {
          masked[key] = edgeFunctionDebugger.maskSensitiveData(masked[key]);
        }
      }
      return masked;
    }
    
    return data;
  },

  /**
   * Formats a log message with timestamp and context
   */
  formatLogMessage: (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      context: edgeFunctionDebugger.maskSensitiveData(context)
    }, null, 2);
  },

  /**
   * Logs incoming request with masked sensitive data
   */
  logRequest: (request, context = {}) => {
    const logData = {
      method: request.method,
      url: request.url,
      headers: edgeFunctionDebugger.maskSensitiveData(Object.fromEntries(request.headers.entries())),
      ...context
    };
    
    console.log(edgeFunctionDebugger.formatLogMessage('INFO', 'Incoming Request', logData));
  },

  /**
   * Logs API response
   */
  logResponse: (status, data, context = {}) => {
    const logData = {
      status,
      success: status >= 200 && status < 300,
      dataPresent: !!data,
      ...context
    };
    
    console.log(edgeFunctionDebugger.formatLogMessage('INFO', 'Outgoing Response', logData));
  },

  /**
   * Logs errors with full context and stack traces
   */
  logError: (error, context = {}) => {
    const logData = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      ...context
    };
    
    console.error(edgeFunctionDebugger.formatLogMessage('ERROR', 'Error Occurred', logData));
  },

  /**
   * Logs validation results
   */
  logValidation: (field, isValid, details = {}) => {
    const logData = {
      field,
      isValid,
      ...details
    };
    
    const level = isValid ? 'INFO' : 'WARN';
    console.log(edgeFunctionDebugger.formatLogMessage(level, 'Validation Check', logData));
  },

  /**
   * Logs API calls to external services
   */
  logAPICall: (service, endpoint, payload = {}) => {
    const logData = {
      service,
      endpoint,
      payloadSize: JSON.stringify(payload).length,
      payloadKeys: Object.keys(payload)
    };
    
    console.log(edgeFunctionDebugger.formatLogMessage('INFO', 'External API Call', logData));
  }
};