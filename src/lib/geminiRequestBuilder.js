import { GEMINI_CONFIG } from './geminiConfig';
import { validateBase64String } from './geminiValidation';

/**
 * Builder for Gemini API requests
 * Exported for use in Edge Functions and frontend
 */

export const buildSimplePrompt = () => {
  return `Extract the following fields from the PDF document:
  - sapid (Equipment ID/Number)
  - sap_location (Functional Location)
  - transformer_operation_code (Operation Code)
  - max_voltage (Maximum Voltage)
  - construction_year (Year of Manufacture)
  
  Return ONLY valid JSON. Use null for missing fields.`;
};

export const buildComplexPrompt = () => {
  return `You are a specialized data extraction assistant for electrical engineering documents. 
  Extract the following technical specifications from the provided Transformer/Equipment PDF.
  
  Target Fields:
  1. sapid: The SAP Equipment ID (often labeled as "Equipment", "Equip. No", or just a sequence of digits).
  2. sap_location: The Functional Location (e.g., "SUB-01-TR-01").
  3. transformer_operation_code: The operation code or status code.
  4. max_voltage: Maximum voltage in kV (extract just the number, e.g., 13.8 or 69).
  5. construction_year: Year of manufacture or installation (4 digits).

  Instructions:
  - Analyze the entire text content carefully.
  - Return the result as a strict JSON object.
  - Keys MUST be exactly: "sapid", "sap_location", "transformer_operation_code", "max_voltage", "construction_year".
  - If a value is not found, use null. Do not use "N/A" or "Unknown".
  - Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.`;
};

export const buildGeminiRequest = (base64Data, promptType = 'complex') => {
  // Validate input first
  const validation = validateBase64String(base64Data);
  if (!validation.valid) {
    throw new Error(`Request build failed: ${validation.message}`);
  }

  const promptText = promptType === 'simple' ? buildSimplePrompt() : buildComplexPrompt();

  return {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          },
          {
            text: promptText
          }
        ]
      }
    ],
    generationConfig: GEMINI_CONFIG.GENERATION_CONFIG,
    safetySettings: GEMINI_CONFIG.SAFETY_SETTINGS
  };
};

export const validateRequestStructure = (request) => {
  if (!request.contents?.[0]?.parts) return false;
  return true;
};