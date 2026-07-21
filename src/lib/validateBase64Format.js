export const isValidBase64 = (str) => {
  if (typeof str !== 'string') return false;
  if (str ==='' || str.trim() === '') return false;
  
  // Basic Regex for Base64 (alphanumeric + '+' + '/' + optional padding '=')
  // We explicitly check for whitespace because standard Base64 shouldn't have newlines inside strictly speaking for API transport often,
  // though generic decoders handle them. We want to be strict.
  const regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return regex.test(str);
};

export const validatePDFChecksum = async (base64Str) => {
  // Simple check: Convert to buffer and check header
  try {
    const binaryString = window.atob(base64Str);
    const len = binaryString.length;
    const bytes = new Uint8Array(Math.min(len, 5)); // Check first 5 bytes
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PDF header signature: %PDF-
    const header = String.fromCharCode(...bytes);
    if (!header.startsWith('%PDF-')) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const getBase64Info = (base64Str) => {
  if (!base64Str) return { length: 0, sizeInBytes: 0, valid: false };
  
  // Calculate approximate size in bytes
  // Each base64 char = 6 bits. 4 chars = 3 bytes.
  const padding = (base64Str.match(/=/g) || []).length;
  const sizeInBytes = (base64Str.length * 3 / 4) - padding;

  return {
    length: base64Str.length,
    sizeInBytes: Math.floor(sizeInBytes),
    valid: isValidBase64(base64Str)
  };
};