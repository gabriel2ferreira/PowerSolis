import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/debugLogger';

// Helper to map Gemini data structure to our DB schema
const mapToEquipmentSchema = (extractedData, userId) => {
  return {
    name: extractedData.equipmentName || extractedData.name || 'Imported Equipment',
    voltage_level: extractedData.voltageLevel ? String(extractedData.voltageLevel) : null,
    temperature: extractedData.temperature ? parseFloat(extractedData.temperature) : null,
    substation_id: extractedData.substationId || null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };
};

export const useEquipmentImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  /**
   * Resolves equipment type ID from type name
   */
  const resolveEquipmentType = useCallback(async (typeName) => {
    if (!typeName) return null;
    
    try {
      const { data, error } = await supabase
        .from('equipment_types')
        .select('id')
        .ilike('name', typeName)
        .single();

      if (data) {
        return data.id;
      }
      
      // If error or no data, we might need to create it
      logger.info('useEquipmentImport', `Equipment type '${typeName}' not found, creating new type.`);
      
      const { data: newType, error: createError } = await supabase
        .from('equipment_types')
        .insert({ name: typeName, description: 'Auto-created from PDF import' })
        .select()
        .single();

      if (createError) {
        // If concurrent creation happened or other error, try fetching again
        const { data: retryData } = await supabase
          .from('equipment_types')
          .select('id')
          .ilike('name', typeName)
          .single();
          
        if (retryData) return retryData.id;
        
        throw new Error(`Failed to resolve equipment type: ${typeName}`);
      }
      return newType.id;
    } catch (err) {
      logger.error('useEquipmentImport', 'Error resolving equipment type', err);
      // Fallback: fetch any valid type or handle gracefully
      return null;
    }
  }, []);

  /**
   * Saves equipment data to database
   */
  const importEquipmentData = useCallback(async (extractedData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to import data', variant: 'destructive' });
      return { success: false };
    }

    setImporting(true);
    logger.info('useEquipmentImport', 'Starting equipment import', extractedData);
    
    try {
      // 1. Validation
      if (!extractedData.equipmentName) {
        throw new Error("Equipment Name is required");
      }

      // 2. Resolve equipment type
      const typeName = extractedData.equipmentType || 'Unknown';
      let equipmentTypeId = await resolveEquipmentType(typeName);
      
      if (!equipmentTypeId) {
          // If still null, try to get a default 'Unknown' type or create it
           equipmentTypeId = await resolveEquipmentType('Unknown');
      }

      // 3. Create equipment record
      const equipmentRecord = {
        ...mapToEquipmentSchema(extractedData, user.id),
        equipment_type_id: equipmentTypeId
      };

      const { data: equipment, error: equipmentError } = await supabase
        .from('equipments')
        .insert(equipmentRecord)
        .select()
        .single();

      if (equipmentError) throw equipmentError;

      // 4. Create custom fields if present
      if (extractedData.customFields && extractedData.customFields.length > 0) {
        const customFieldsData = extractedData.customFields.map(field => ({
          equipment_id: equipment.id,
          field_name: field.name,
          field_type: 'text',
          observations: `Extracted Value: ${field.value}`
        }));

        const { error: fieldsError } = await supabase
          .from('custom_fields')
          .insert(customFieldsData);

        if (fieldsError) {
          logger.error('useEquipmentImport', 'Error creating custom fields', fieldsError);
        }
      }
      
      // 5. Log import history
      await supabase.from('equipment_history').insert({
          equipment_id: equipment.id,
          changed_by: user.id,
          change_type: 'created',
          field_name: 'import',
          new_value: 'Imported via PDF Text Analysis',
          old_value: null
      });

      setImporting(false);
      logger.info('useEquipmentImport', 'Import completed successfully');
      return { success: true, equipment };

    } catch (error) {
      setImporting(false);
      logger.error('useEquipmentImport', 'Import failed', error);
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  }, [user, resolveEquipmentType, toast]);

  return {
    importing,
    importEquipmentData
  };
};