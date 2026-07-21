// This file is no longer needed as we use direct Gemini 1.5 Flash PDF processing in the Edge Function
// The previous content has been removed to reduce bundle size
export const PDFTextExtractor = {
  extractText: async () => {
    throw new Error("PDFTextExtractor is deprecated. Use extract-pdf-data Edge Function directly.");
  }
};