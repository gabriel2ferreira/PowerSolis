import { GEMINI_CONFIG } from './geminiConfig';

/**
 * Validates a file object before processing
 */
export const validatePDFFile = (file) => {
  if (!file) {
    return { valid: false, message: "No file provided" };
  }
  
  if (file.type !== "application/pdf") {
    return { valid: false, message: `Invalid mime type: ${file.type}. Expected application/pdf` };
  }
  
  if (file.size > GEMINI_CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${GEMINI_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  return { valid: true };
};

/**
 * Validates base64 string format and constraints
 */
export const validateBase64String = (base64) => {
  if (!base64 || typeof base64 !== 'string') {
    return { valid: false, message: "Invalid base64 input" };
  }

  // Check for whitespace (should be stripped)
  if (/\s/.test(base64)) {
    return { valid: false, message: "Base64 string contains invalid whitespace/line breaks" };
  }

  // Basic regex check
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64)) {
    return { valid: false, message: "Invalid base64 characters detected" };
  }

  // Length check (approximate size)
  // 4 chars = 3 bytes
  const sizeInBytes = (base64.length * 3) / 4;
  if (sizeInBytes > GEMINI_CONFIG.MAX_PAYLOAD_SIZE) {
    return { 
      valid: false, 
      message: `Encoded size ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB exceeds payload limit` 
    };
  }

  return { valid: true };
};

/**
 * Validates the Gemini JSON payload structure
 */
export const validatePayloadStructure = (payload) => {
  if (!payload || !payload.contents || !Array.isArray(payload.contents)) {
    return { valid: false, message: "Missing 'contents' array in payload" };
  }

  const parts = payload.contents[0]?.parts;
  if (!parts || !Array.isArray(parts)) {
    return { valid: false, message: "Missing 'parts' array in payload content" };
  }

  const hasData = parts.some(p => p.inlineData && p.inlineData.data);
  const hasText = parts.some(p => p.text);

  if (!hasData && !hasText) {
    return { valid: false, message: "Payload must contain either inlineData or text" };
  }

  return { valid: true };
};

export const validateMimeType = (type) => {
  return type === 'application/pdf';
};

export const validateFileSize = (bytes) => {
  return bytes <= GEMINI_CONFIG.MAX_FILE_SIZE;
};