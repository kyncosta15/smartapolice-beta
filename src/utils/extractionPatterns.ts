
export const EXTRACTION_PATTERNS = {
  // Padrões principais para dados essenciais
  insuredName: /Nome\s+do\(?a?\)?\s+Segurado\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]+)/i,
  cpfCnpj: /CPF\/CNPJ\s*[:\s]*([\d\.\-\/]+)/i,
  policyNumber: /Apólice\s*[:\s]*([\d\.\-\/]+)/i,
  
  // Padrões de vigência mais específicos
  startDate: /Vig(?:ência)?\s+do\s+Seguro\s*(?:Das)?\s*24:00.*?(\d{2}\/\d{2}\/\d{4})/i,
  endDate: /às\s+24:00.*?(\d{2}\/\d{2}\/\d{4})/i,
  
  // Padrões financeiros
  totalPremium: /Prêmio\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
  installmentValue: /\d{4}\s*\d{2}\/\d{2}\/\d{4}\s*([0-9\.,]+)/gi,
  installmentDate: /\d{4}\s*(\d{2}\/\d{2}\/\d{4})\s*[0-9\.,]+/gi,
  numberOfInstallments: /N[ºo]*\s*Parcelas\s*[:\s]*([0-9]{1,2})/i,
  
  // Padrões de cobertura e veículo
  coverageType: /Cobertura\s*[:\s]*(COMPREENSIVA|BÁSICA|COMPLETA|[A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i,
  vehicleModel: /Marca\/Tipo\s+do\s+Veículo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
  licensePlate: /Placa\s*[:\s]*([A-Z0-9]{7,8})/i,
  fipeCode: /Código\s+FIPE\s*[:\s]*([0-9\.\-]+)/i,
  
  // Padrões alternativos
  alternativePatterns: {
    insuredName: [
      /Segurado\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]+)/i,
      /Nome\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]+)/i
    ],
    policyNumber: [
      /(?:Apólice|Apolice|Número|Numero)\s*[:\s]*([0-9\.\-\/]+)/i,
      /N[ºo]\s*([0-9\.\-\/]+)/i
    ],
    totalPremium: [
      /Prêmio\s*(?:Total|Anual)?\s*(?:\(R\$\))?\s*[:\s]*([0-9\.,]+)/i,
      /Valor\s+Total\s*[:\s]*([0-9\.,]+)/i,
      /Total\s*[:\s]*R\$?\s*([0-9\.,]+)/i
    ],
    startDate: [
      /Início\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
      /Data\s+Início.*?(\d{2}\/\d{2}\/\d{4})/i,
      /De\s+(\d{2}\/\d{2}\/\d{4})/i
    ],
    endDate: [
      /(?:Fim|Final|Término)\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
      /Até\s+(\d{2}\/\d{2}\/\d{4})/i,
      /Vence\s+em\s+(\d{2}\/\d{2}\/\d{4})/i
    ]
  }
};

// Lista atualizada de seguradoras
export const INSURANCE_COMPANIES_LIST = [
  "Bradesco Seguros",
  "Liberty Seguros", 
  "Yelum Seguros",
  "HDI Seguros",
  "Allianz Seguros",
  "Porto Seguro",
  "Mapfre Seguros",
  "Tokio Marine",
  "SulAmérica",
  "Zurich Seguros",
  "Azul Seguros",
  "Suhai Seguradora",
  "Itaú Seguros",
  "Sompo Seguros",
  "Icatu Seguros",
  "Capemisa",
  "MetLife",
  "Prudential",
  "Youse",
  "Seguros Unimed",
  "Centauro-ON",
  "BB Seguros",
  "Assurant"
];
