/**
 * Utility to validate and map extracted PDF data to database schema
 */

export const validateExtractedData = (data) => {
  const errors = [];
  const sanitizedData = { ...data };

  // Required Fields
  if (!sanitizedData.equipmentName || sanitizedData.equipmentName.trim() === '') {
    errors.push('Equipment Name is required');
  }

  // Ensure arrays exist
  if (!Array.isArray(sanitizedData.customFields)) {
    sanitizedData.customFields = [];
  }
  
  if (!Array.isArray(sanitizedData.measurements)) {
    sanitizedData.measurements = [];
  }

  // Sanitize numeric fields
  if (sanitizedData.voltageLevel && typeof sanitizedData.voltageLevel === 'string') {
    const parsed = parseFloat(sanitizedData.voltageLevel);
    sanitizedData.voltageLevel = isNaN(parsed) ? null : parsed;
  }

  if (sanitizedData.temperature && typeof sanitizedData.temperature === 'string') {
    const parsed = parseFloat(sanitizedData.temperature);
    sanitizedData.temperature = isNaN(parsed) ? null : parsed;
  }

  // Default type if missing
  if (!sanitizedData.equipmentType) {
    sanitizedData.equipmentType = 'Unknown';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

export const mapToEquipmentSchema = (extractedData, userId) => {
  return {
    name: extractedData.equipmentName,
    voltage_level: extractedData.voltageLevel ? extractedData.voltageLevel.toString() : null,
    temperature: extractedData.temperature || null,
    substation_id: extractedData.substationId || null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };
};