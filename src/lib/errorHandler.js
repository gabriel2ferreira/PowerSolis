import { useLanguage } from '@/contexts/LanguageContext';

export class AppError extends Error {
  constructor(code, messageEn, messagePt, severity = 'error', recoveryAction = null, metadata = {}) {
    super(messageEn);
    this.name = 'AppError';
    this.code = code;
    this.messageEn = messageEn;
    this.messagePt = messagePt;
    this.severity = severity; // 'info', 'warning', 'error', 'critical'
    this.recoveryAction = recoveryAction; // e.g., 'retry', 'login', 'refresh'
    this.metadata = metadata;
  }
}

export class PDFValidationError extends AppError {
  constructor(messageEn, messagePt, recoveryAction = 'select_new_file') {
    super('PDF_VALIDATION_ERROR', messageEn, messagePt, 'warning', recoveryAction);
  }
}

export class Base64ValidationError extends AppError {
  constructor(messageEn, messagePt) {
    super('BASE64_VALIDATION_ERROR', messageEn, messagePt, 'error', 'retry_upload');
  }
}

export class GeminiAPIError extends AppError {
  constructor(messageEn, messagePt, canRetry = true) {
    super(
      'GEMINI_API_ERROR', 
      messageEn, 
      messagePt, 
      'error', 
      canRetry ? 'retry' : 'manual_entry'
    );
  }
}

export class TimeoutError extends AppError {
  constructor(seconds) {
    super(
      'TIMEOUT_ERROR',
      `Operation timed out after ${seconds} seconds.`,
      `A operação excedeu o tempo limite de ${seconds} segundos.`,
      'warning',
      'retry'
    );
  }
}

export class APIError extends AppError {
  constructor(status, messageEn, messagePt, recoveryAction = 'retry') {
    super(`API_ERROR_${status}`, messageEn, messagePt, 'error', recoveryAction);
    this.status = status;
  }
}

export class DataProcessingError extends AppError {
  constructor(messageEn, messagePt) {
    super('DATA_PROCESSING_ERROR', messageEn, messagePt, 'error', 'contact_support');
  }
}

export class NetworkError extends AppError {
  constructor(originalError) {
    super(
      'NETWORK_ERROR',
      'Network connection failed. Please check your internet.',
      'Falha na conexão de rede. Verifique sua internet.',
      'warning',
      'retry'
    );
    this.originalError = originalError;
  }
}

export const getErrorMessage = (error, language = 'en') => {
  if (error instanceof AppError) {
    return language === 'pt-BR' ? error.messagePt : error.messageEn;
  }
  return language === 'pt-BR' 
    ? 'Ocorreu um erro inesperado.' 
    : 'An unexpected error occurred.';
};

export const getDetailedErrorMessage = (error, language = 'en') => {
  const baseMessage = getErrorMessage(error, language);
  
  let suggestion = '';
  if (language === 'pt-BR') {
    if (error.recoveryAction === 'retry') suggestion = 'Tente novamente.';
    if (error.recoveryAction === 'select_new_file') suggestion = 'Selecione outro arquivo.';
    if (error.recoveryAction === 'manual_entry') suggestion = 'Tente inserir os dados manualmente.';
  } else {
    if (error.recoveryAction === 'retry') suggestion = 'Please try again.';
    if (error.recoveryAction === 'select_new_file') suggestion = 'Please select another file.';
    if (error.recoveryAction === 'manual_entry') suggestion = 'Try entering data manually.';
  }

  return {
    title: error.code || 'Error',
    message: baseMessage,
    suggestion,
    type: error.name,
    retryable: error.recoveryAction === 'retry'
  };
};