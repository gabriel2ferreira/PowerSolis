/**
 * Utility to validate Gemini API requests and responses.
 * Ensures data integrity before sending to or processing from the API.
 */

export const geminiValidator = {
  /**
   * Validates Base64 string format and constraints
   */
  validateBase64Data: (base64String) => {
    if (!base64String) {
      return { valid: false, error: 'Base64 string is empty or null' };
    }
    if (typeof base64String !== 'string') {
      return { valid: false, error: 'Input is not a string' };
    }
    
    // Check for whitespace (should be stripped)
    if (/\s/.test(base64String)) {
      return { valid: false, error: 'Base64 string contains invalid whitespace' };
    }

    // Basic regex check for valid characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64String)) {
      return { valid: false, error: 'String contains invalid Base64 characters' };
    }

    return { valid: true };
  },

  /**
   * Verifies the payload matches Gemini API spec
   */
  validatePayloadStructure: (payload) => {
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Payload must be an object' };
    }

    if (!payload.contents || !Array.isArray(payload.contents)) {
      return { valid: false, error: "Missing 'contents' array" };
    }

    const firstContent = payload.contents[0];
    if (!firstContent?.parts || !Array.isArray(firstContent.parts)) {
      return { valid: false, error: "Missing 'parts' array in contents" };
    }

    const hasInlineData = firstContent.parts.some(p => p.inlineData && p.inlineData.mimeType && p.inlineData.data);
    const hasText = firstContent.parts.some(p => p.text);

    if (!hasInlineData && !hasText) {
      return { valid: false, error: 'Payload must contain inlineData (PDF) or text prompt' };
    }

    return { valid: true };
  },

  /**
   * Verifies Gemini response structure
   */
  validateGeminiResponse: (response) => {
    if (!response) {
      return { valid: false, error: 'Empty response from Gemini' };
    }

    if (response.error) {
      return { valid: false, error: response.error.message || 'Gemini API Error', data: response.error };
    }

    if (!response.candidates || !Array.isArray(response.candidates) || response.candidates.length === 0) {
      // Check for prompt feedback blocks
      if (response.promptFeedback?.blockReason) {
        return { valid: false, error: `Blocked: ${response.promptFeedback.blockReason}` };
      }
      return { valid: false, error: 'No candidates returned in response' };
    }

    const content = response.candidates[0].content;
    if (!content?.parts?.[0]?.text) {
      return { valid: false, error: 'Response candidate missing text content' };
    }

    return { valid: true, data: content.parts[0].text };
  },

  /**
   * Extracts detailed error info
   */
  parseGeminiError: (response) => {
    if (!response) return "Unknown error";
    if (typeof response === 'string') return response;
    
    if (response.error) {
      return `${response.error.code || 'Error'}: ${response.error.message || 'Unknown Gemini Error'}`;
    }
    return JSON.stringify(response);
  }
};