import { logger } from '@/lib/debugLogger';

/**
 * Maps extracted data to database schema
 */
export const EquipmentDataMapper = {
  /**
   * Maps extracted fields to equipment table schema
   * @param {object} extractedData - Raw data from extraction service
   * @param {string} userId - ID of the user creating the record
   * @returns {object} - Mapped object ready for DB insertion validation
   */
  mapExtractedDataToEquipment: (extractedData, userId) => {
    try {
      if (!extractedData) return null;

      // Sanitize and map
      const mapped = {
        name: extractedData.equipment_name || extractedData.name || 'Unknown Equipment',
        // voltage_level is text in DB schema, ensure string
        voltage_level: extractedData.voltage_level ? String(extractedData.voltage_level) : null,
        // temperature is numeric in DB schema
        temperature: extractedData.temperature ? parseFloat(extractedData.temperature) : null,
        substation_id: extractedData.substation_id || null,
        created_by: userId,
        created_at: new Date().toISOString(),
        
        // Metadata for UI/Logic (not direct DB columns yet)
        equipment_type_name: extractedData.equipment_type || 'Unknown',
        custom_fields: Array.isArray(extractedData.custom_fields) ? extractedData.custom_fields : [],
        raw_text: extractedData.raw_text || '',
        confidence_score: extractedData.confidence_score || 0.5
      };

      // Handle potential NaN from parseFloat
      if (isNaN(mapped.temperature)) mapped.temperature = null;

      logger.info('EquipmentDataMapper', 'Mapped data', mapped);
      return mapped;

    } catch (err) {
      logger.error('EquipmentDataMapper', 'Mapping error', err);
      return null;
    }
  }
};