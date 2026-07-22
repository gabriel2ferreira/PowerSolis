import { PDFValidationError, Base64ValidationError } from './errorHandler';
import { isValidBase64 } from './validateBase64Format';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const validatePDFFile = (file) => {
  if (!file) {
    throw new PDFValidationError(
      'No file selected.',
      'Nenhum arquivo selecionado.'
    );
  }

  // Mime type check
  if (file.type !== 'application/pdf') {
    throw new PDFValidationError(
      'Invalid file type. Only PDF files are allowed.',
      'Tipo de arquivo inválido. Apenas arquivos PDF são permitidos.'
    );
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new PDFValidationError(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the limit of 20MB.`,
      `O tamanho do arquivo (${(file.size / 1024 / 1024).toFixed(2)}MB) excede o limite de 20MB.`
    );
  }

  return true;
};

export const validateBase64Encoding = (base64String) => {
  if (!base64String) {
    throw new Base64ValidationError(
      'Empty data received.',
      'Dados vazios recebidos.'
    );
  }

  if (!isValidBase64(base64String)) {
    throw new Base64ValidationError(
      'File encoding failed. The data is corrupted or invalid Base64.',
      'A codificação do arquivo falhou. Os dados estão corrompidos ou em Base64 inválido.'
    );
  }
  
  return true;
};

export const validateExtractedData = (data) => {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid data structure'] };
  }

  // Prompt requested fields: sapid, sap_location, transformer_operation_code, max_voltage, construction_year
  // We'll treat them as warnings if missing, not strict errors, to allow manual fix
  const requiredFields = ['sapid', 'sap_location', 'max_voltage'];
  const missing = requiredFields.filter(field => !data[field]);

  if (missing.length > 0) {
    // We return valid: true but with warnings, because user can manually fix
    return { 
      valid: true, 
      warnings: missing.map(f => `${f} missing`)
    };
  }

  return {
    valid: true,
    errors: []
  };
};

export const sanitizeData = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>?/gm, '').trim();
};