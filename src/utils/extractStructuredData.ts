
// Utility function to extract structured data from PDF text
export function extractStructuredData(text: string): any | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  // Basic extraction patterns for common policy data
  const patterns = {
    segurado: /segurado[:\s]+([^\n\r]+)/i,
    seguradora: /seguradora[:\s]+([^\n\r]+)/i,
    apolice: /ap[óo]lice[:\s#n°]+([^\s\n\r]+)/i,
    vigencia: /vig[êe]ncia[:\s]+(\d{2}\/\d{2}\/\d{4})[^\d]*(\d{2}\/\d{2}\/\d{4})/i,
    premio: /pr[êe]mio[:\s]+r?\$?\s*(\d+[.,]?\d*)/i,
  };

  const extractedData: any = {};

  // Extract basic information
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      if (key === 'vigencia' && match[1] && match[2]) {
        extractedData.inicio_vigencia = match[1];
        extractedData.fim_vigencia = match[2];
      } else if (match[1]) {
        extractedData[key] = match[1].trim();
      }
    }
  });

  return Object.keys(extractedData).length > 0 ? extractedData : null;
}
