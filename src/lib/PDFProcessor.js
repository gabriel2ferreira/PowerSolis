import { validatePDFFile, validateBase64Encoding } from './pdfValidation'; // Keeping existing for compatibility
import { validatePDFFile as geminiValidateFile, validateBase64String } from './geminiValidation';
import { PDFValidationError, DataProcessingError, TimeoutError } from './errorHandler';
import { geminiLogger } from './geminiLogger';
import { GEMINI_CONFIG } from './geminiConfig';

/**
 * Utility for processing PDF files for upload
 * Enhanced with Gemini validation and logging
 */
export const PDFProcessor = {
  /**
   * Validates and converts a file to Base64 string with timeout
   * @param {File} file - The file object to process
   * @returns {Promise<{base64: string, fileName: string, fileSize: number}>}
   * @throws {PDFValidationError | DataProcessingError | TimeoutError}
   */
  convertFileToBase64: async (file) => {
    geminiLogger.log('Starting PDF Processing', { name: file.name, size: file.size });

    // 1. Validate File
    try {
      // Use Gemini validator
      const validation = geminiValidateFile(file);
      geminiLogger.logValidationStep('File Check', validation);
      
      if (!validation.valid) {
        throw new PDFValidationError(validation.message, validation.message);
      }
    } catch (error) {
      geminiLogger.logError(error, 'File Validation');
      throw error;
    }

    // 2. Read File with Timeout
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const err = new TimeoutError(GEMINI_CONFIG.REQUEST_TIMEOUT / 1000);
        geminiLogger.logError(err, 'FileReader Timeout');
        reject(err);
      }, GEMINI_CONFIG.REQUEST_TIMEOUT);

      const reader = new FileReader();

      reader.onload = () => {
        clearTimeout(timeoutId);
        try {
          const content = reader.result;
          if (typeof content !== 'string') {
             throw new DataProcessingError('Failed to read file as string', 'Falha ao ler arquivo como texto');
          }
          
          // Strip header (data:application/pdf;base64,)
          const base64Data = content.split(',')[1];
          
          // 3. Strict Base64 Validation
          const base64Validation = validateBase64String(base64Data);
          geminiLogger.logValidationStep('Base64 Check', base64Validation);

          if (!base64Validation.valid) {
             throw new DataProcessingError(base64Validation.message, 'Erro na codificação Base64');
          }

          resolve({
            base64: base64Data,
            fileName: file.name,
            fileSize: file.size
          });
        } catch (err) {
          geminiLogger.logError(err, 'Base64 Conversion');
          reject(err);
        }
      };

      reader.onerror = () => {
        clearTimeout(timeoutId);
        const err = new DataProcessingError('Error occurred while reading the file', 'Erro ao ler o arquivo');
        geminiLogger.logError(err, 'FileReader Error');
        reject(err);
      };

      reader.readAsDataURL(file);
    });
  }
};