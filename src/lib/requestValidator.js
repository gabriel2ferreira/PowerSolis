export const validateGeminiRequest = (payload) => {
  const result = { valid: true, errors: [], warnings: [] };

  if (!payload || typeof payload !== 'object') {
    result.valid = false;
    result.errors.push('Payload must be an object');
    return result;
  }

  if (!payload.pdfBase64) {
    result.valid = false;
    result.errors.push('pdfBase64 field is missing');
  }

  return result;
};

export const validateGeminiResponse = (response) => {
  const result = { valid: true, errors: [], warnings: [] };

  if (!response) {
    result.valid = false;
    result.errors.push('Empty response from AI service');
    return result;
  }

  // Check if it's our structured response
  if (!response.equipmentName && !response.name) {
     result.warnings.push('Response might be missing key equipment data');
  }

  return result;
};

export const validateEquipmentData = (data) => {
  const result = { valid: true, errors: [], warnings: [] };
  
  if (!data.equipmentName || data.equipmentName.trim().length < 2) {
    result.valid = false;
    result.errors.push('Equipment Name is invalid or too short');
  }

  // Soft validation
  if (!data.voltageLevel) result.warnings.push('Voltage Level is missing');
  if (!data.temperature) result.warnings.push('Temperature is missing');

  return result;
};

export const validateCustomFields = (fields) => {
  const result = { valid: true, errors: [], warnings: [] };
  
  if (!Array.isArray(fields)) return result;

  fields.forEach((field, index) => {
    if (!field.name) {
      result.errors.push(`Custom field at index ${index} missing name`);
      result.valid = false;
    }
  });

  return result;
};