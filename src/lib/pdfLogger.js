import { logger } from './debugLogger';

// Enhance the existing logger with PDF specific context
export const pdfLogger = {
  logUploadStart: (fileName, fileSize) => {
    logger.info('PDF_FLOW', 'Upload Started', { fileName, size: fileSize });
  },

  logValidation: (fileName, status, errors = []) => {
    if (status === 'success') {
      logger.info('PDF_FLOW', 'Validation Passed', { fileName });
    } else {
      logger.warn('PDF_FLOW', 'Validation Failed', { fileName, errors });
    }
  },

  logAPICall: (endpoint, payloadSize) => {
    logger.info('PDF_FLOW', `Calling API: ${endpoint}`, { payloadSize });
  },

  logExtraction: (fileName, durationMs, fieldsFound) => {
    logger.info('PDF_FLOW', 'Extraction Complete', { 
      fileName, 
      duration: `${durationMs}ms`,
      fieldsCount: fieldsFound 
    });
  },

  logError: (fileName, stage, error) => {
    logger.error('PDF_FLOW', `Error during ${stage}`, { 
      fileName, 
      error: error.message || error 
    });
  },

  logSuccess: (fileName, data) => {
    // Sanitize log data if needed (remove huge text blobs)
    const logSafeData = { ...data };
    delete logSafeData.raw_text; 
    logger.info('PDF_FLOW', 'Process Success', { fileName, extracted: logSafeData });
  }
};