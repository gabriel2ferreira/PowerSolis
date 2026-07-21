/**
 * Comprehensive logging utility for PDF import debugging
 * Provides detailed, timestamped logging for all PDF processing steps
 */

const formatTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const logWithContext = (level, context, message, details = null) => {
  const timestamp = formatTimestamp();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️';

  console.log(`${prefix} [${timestamp}] [${context}] ${message}`);
  if (details) {
    console.log('   Details:', details);
  }
};

export const pdfImportDebugger = {
  /**
   * Log validation step results
   */
  logValidationStep: (stepName, passed, details = null) => {
    const level = passed ? 'success' : 'error';
    const message = passed ? `${stepName} - PASSED` : `${stepName} - FAILED`;
    logWithContext(level, 'VALIDATION', message, details);
  },

  /**
   * Log base64 string information
   */
  logBase64Info: (base64String) => {
    if (!base64String) {
      logWithContext('error', 'BASE64', 'Base64 string is empty or null');
      return;
    }

    const info = {
      length: base64String.length,
      approximateSizeMB: (base64String.length * 0.75 / 1024 / 1024).toFixed(2),
      firstChars: base64String.substring(0, 50),
      lastChars: base64String.substring(base64String.length - 50),
      isValidFormat: /^[A-Za-z0-9+/=]*$/.test(base64String)
    };

    logWithContext('info', 'BASE64', 'Base64 encoding information', info);
  },

  /**
   * Log file information
   */
  logFileInfo: (file) => {
    if (!file) {
      logWithContext('error', 'FILE', 'File object is null or undefined');
      return;
    }

    const info = {
      name: file.name,
      size: file.size,
      sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    };

    logWithContext('info', 'FILE', 'File information', info);
  },

  /**
   * Log API call details
   */
  logAPICall: (functionName, payload) => {
    const safePayload = {
      ...payload,
      pdfBase64: payload.pdfBase64 
        ? `[BASE64 STRING - ${payload.pdfBase64.length} chars]` 
        : undefined,
      pdf_base64: payload.pdf_base64 
        ? `[BASE64 STRING - ${payload.pdf_base64.length} chars]` 
        : undefined
    };

    logWithContext('info', 'API_CALL', `Calling ${functionName}`, safePayload);
  },

  /**
   * Log API response details
   */
  logAPIResponse: (functionName, response) => {
    const info = {
      success: response?.success || false,
      hasData: !!response?.data,
      hasError: !!response?.error,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      error: response?.error || null
    };

    const level = response?.success ? 'success' : 'error';
    logWithContext(level, 'API_RESPONSE', `Response from ${functionName}`, info);
  },

  /**
   * Log error with full context and stack trace
   */
  logError: (context, error, additionalDetails = null) => {
    const errorInfo = {
      name: error?.name || 'Unknown',
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack trace',
      ...additionalDetails
    };

    logWithContext('error', context, 'Error occurred', errorInfo);
  },

  /**
   * Log progress update
   */
  logProgress: (step, message, percentage = null) => {
    const progressInfo = percentage !== null 
      ? `${message} (${percentage}%)` 
      : message;
    
    logWithContext('info', 'PROGRESS', `Step: ${step}`, { message: progressInfo });
  },

  /**
   * Log retry attempt
   */
  logRetry: (attempt, maxAttempts, reason) => {
    logWithContext('warning', 'RETRY', `Attempt ${attempt}/${maxAttempts}`, { reason });
  },

  /**
   * Log section header for better organization
   */
  logSectionStart: (sectionName) => {
    console.log('\n' + '='.repeat(80));
    console.log(`🚀 ${sectionName} - ${formatTimestamp()}`);
    console.log('='.repeat(80));
  },

  /**
   * Log section end
   */
  logSectionEnd: (sectionName, success = true) => {
    const status = success ? '✅ SUCCESS' : '❌ FAILED';
    console.log('='.repeat(80));
    console.log(`${status} - ${sectionName} - ${formatTimestamp()}`);
    console.log('='.repeat(80) + '\n');
  }
};