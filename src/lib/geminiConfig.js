/**
 * Configuration for Gemini API integration
 * Used by both frontend and edge functions where applicable
 */
export const GEMINI_CONFIG = {
  // Official Gemini API Endpoint - Updated to gemini-3-flash-preview
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
  
  // Model identifier - Updated to gemini-3-flash-preview
  GEMINI_MODEL: "gemini-3-flash-preview",
  
  // File size limits (in bytes)
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_PAYLOAD_SIZE: 20 * 1024 * 1024, // 20MB (Buffer for encoding overhead)
  
  // Timeout settings - Updated to 4 minutes (240 seconds)
  REQUEST_TIMEOUT: 240000, 
  
  // Retry strategy
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff in ms
  
  // Safety settings to prevent over-filtering of technical content
  SAFETY_SETTINGS: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ],
  
  // Generation configuration
  GENERATION_CONFIG: {
    temperature: 0.1, // Low temperature for factual extraction
    maxOutputTokens: 2048,
    topP: 0.8,
    topK: 40
  },

  // Standard fields to extract
  REQUIRED_FIELDS: [
    "sapid", 
    "sap_location", 
    "transformer_operation_code", 
    "max_voltage", 
    "construction_year"
  ]
};