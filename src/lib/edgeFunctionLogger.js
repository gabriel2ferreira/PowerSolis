/**
 * Comprehensive logging utility for Edge Functions and Frontend debugging.
 * Formats logs with timestamps, context, and masked API keys.
 */

export const maskSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    // Mask generic API keys (sk-..., AIza...)
    if (data.length > 20) {
      return `${data.substring(0, 4)}...${data.substring(data.length - 4)}`;
    }
    return data;
  }
  if (typeof data === 'object') {
    const masked = { ...data };
    for (const key in masked) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }
  return data;
};

const formatLog = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    context: maskSensitiveData(context)
  };
};

export const edgeFunctionLogger = {
  logRequest: (payload) => {
    console.log(JSON.stringify(formatLog('INFO', 'Incoming Request', { 
      type: 'REQUEST',
      payloadSummary: payload ? Object.keys(payload) : 'empty' 
    })));
  },

  logResponse: (response) => {
    console.log(JSON.stringify(formatLog('INFO', 'Outgoing Response', { 
      type: 'RESPONSE',
      status: response?.status,
      success: response?.success
    })));
  },

  logError: (error, context = '') => {
    console.error(JSON.stringify(formatLog('ERROR', error.message || 'Unknown Error', {
      context,
      stack: error.stack,
      name: error.name
    })));
  },

  logBase64Info: (base64String) => {
    if (!base64String || typeof base64String !== 'string') {
      console.log(JSON.stringify(formatLog('WARN', 'Invalid Base64 Data', { valid: false })));
      return;
    }
    console.log(JSON.stringify(formatLog('INFO', 'Base64 Data Info', {
      length: base64String.length,
      preview: base64String.substring(0, 50) + '...',
      approxSizeMB: (base64String.length * 0.75 / 1024 / 1024).toFixed(2)
    })));
  },

  logGeminiRequest: (request) => {
    const logData = { ...request };
    // Mask the massive base64 data for logging
    if (logData.contents?.[0]?.parts?.[0]?.inlineData?.data) {
      logData.contents[0].parts[0].inlineData.data = '[BASE64_DATA_MASKED]';
    }
    console.log(JSON.stringify(formatLog('INFO', 'Gemini API Request', { request: logData })));
  },

  logGeminiResponse: (response) => {
    console.log(JSON.stringify(formatLog('INFO', 'Gemini API Response', { 
      status: response?.status, 
      headers: response?.headers,
      dataPreview: response?.data ? 'Data present' : 'No data'
    })));
  },

  logAPICall: (service, endpoint, payload = {}) => {
    const logData = {
      service,
      endpoint,
      payloadSize: JSON.stringify(payload).length,
      payloadKeys: Object.keys(payload)
    };
    
    console.log(JSON.stringify(formatLog('INFO', 'External API Call', logData)));
  }
};