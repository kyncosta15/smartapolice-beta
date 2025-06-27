export const EXTRACTION_PATTERNS = {
  // Padrões principais com múltiplas variações para maior precisão
  insuredName: [
    /Nome\s+do\(?a?\)?\s+Segurado\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
    /Segurado\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
    /Nome\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
    /DADOS\s+DO\s+SEGURADO[^]*?Nome[^]*?([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i
  ],

  // Padrões atualizados para CPF/CNPJ com maior flexibilidade
  cpfCnpj: [
    /CPF\/CNPJ\s*[:\s]*([\d\.\-\/]{11,18})/i,
    /CPF\s*[:\s]*([\d\.\-]{11,14})/i,
    /CNPJ\s*[:\s]*([\d\.\-\/]{14,18})/i,
    /Documento\s*[:\s]*([\d\.\-\/]{11,18})/i,
    // Padrões mais permissivos para capturar formatos variados
    /(\d{2,3}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s\/]?\d{4}[\-\s]?\d{2})/g,
    /(\d{11,14})/g // Números puros de 11 ou 14 dígitos
  ],

  // Padrões para detectar tipo de pessoa
  personType: [
    /Pessoa\s+(Física|Jurídica)/i,
    /Tipo\s+de\s+Pessoa\s*[:\s]*(PF|PJ|Física|Jurídica)/i,
    /Natureza\s*[:\s]*(Física|Jurídica)/i
  ],

  policyNumber: [
    /Apólice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Apolice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Número\s+da\s+Apólice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /N[°º]\s*da\s+Apólice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Proposta\s*[:\s]*([\d\.\-\/]{5,})/i
  ],
  
  // Padrões de vigência mais específicos e robustos
  startDate: [
    /Vig(?:ência)?\s+do\s+Seguro\s*(?:Das)?\s*24:00.*?(\d{2}\/\d{2}\/\d{4})/i,
    /Início\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /Data\s+de\s+Início\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /Vigência\s*[:\s]*de\s+(\d{2}\/\d{2}\/\d{4})/i,
    /De\s+(\d{2}\/\d{2}\/\d{4})\s+até/i
  ],

  endDate: [
    /às\s+24:00.*?(\d{2}\/\d{2}\/\d{4})/i,
    /(?:Fim|Final|Término)\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /até\s+(\d{2}\/\d{2}\/\d{4})/i,
    /Vigência\s*[:\s]*.*?até\s+(\d{2}\/\d{2}\/\d{4})/i,
    /Vence\s+em\s+(\d{2}\/\d{2}\/\d{4})/i
  ],
  
  // Padrões financeiros aprimorados
  totalPremium: [
    /Prêmio\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
    /Valor\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
    /Prêmio\s+Anual\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /Total\s+a\s+Pagar\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /Prêmio\s*[:\s]*R?\$?\s*([0-9\.,]+)/i
  ],

  installmentValue: [
    /\d{4}\s*\d{2}\/\d{2}\/\d{4}\s*([0-9\.,]+)/gi,
    /Parcela\s*\d+\s*[:\s]*R?\$?\s*([0-9\.,]+)/gi,
    /\d+[ªº]\s*parcela\s*[:\s]*R?\$?\s*([0-9\.,]+)/gi
  ],

  installmentDate: [
    /\d{4}\s*(\d{2}\/\d{2}\/\d{4})\s*[0-9\.,]+/gi,
    /Parcela\s*\d+\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/gi,
    /(\d{2}\/\d{2}\/\d{4})\s*R?\$?\s*[0-9\.,]+/gi
  ],

  numberOfInstallments: [
    /N[ºo]*\s*Parcelas\s*[:\s]*([0-9]{1,2})/i,
    /(\d{1,2})\s*parcelas/i,
    /Dividido\s+em\s+(\d{1,2})\s*vezes/i,
    /Total\s+de\s+(\d{1,2})\s*parcelas/i
  ],
  
  // Padrões de cobertura e veículo aprimorados
  coverageType: [
    /Cobertura\s*[:\s]*(COMPREENSIVA|BÁSICA|COMPLETA|TOTAL|[A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i,
    /Tipo\s+de\s+Cobertura\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i,
    /Modalidade\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i
  ],

  vehicleModel: [
    /Marca\/Tipo\s+do\s+Veículo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
    /Veículo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
    /Marca\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ]+).*?Modelo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
    /Modelo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i
  ],

  licensePlate: [
    /Placa\s*[:\s]*([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})/i,
    /Placa\s+do\s+Veículo\s*[:\s]*([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})/i
  ],

  fipeCode: [
    /Código\s+FIPE\s*[:\s]*([0-9\.\-]+)/i,
    /FIPE\s*[:\s]*([0-9\.\-]+)/i,
    /Tabela\s+FIPE\s*[:\s]*([0-9\.\-]+)/i
  ]
};

// Lista expandida e atualizada de seguradoras
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
  "Assurant",
  "Generali",
  "Berkley",
  "Chubb",
  "Fairfax",
  "Austral Seguradora"
];

// Padrões específicos por seguradora para maior precisão
export const INSURER_SPECIFIC_PATTERNS = {
  "Liberty Seguros": {
    policyPattern: /Liberty.*?Apólice\s*[:\s]*([0-9\.]+)/i,
    headerPattern: /LIBERTY\s+SEGUROS/i,
    installmentPattern: /\d{4}\s+(\d{2}\/\d{2}\/\d{4})\s+([0-9\.,]+)/gi
  },
  
  "Bradesco Seguros": {
    policyPattern: /BRADESCO.*?([0-9]{4}\.[0-9]{3}\.[0-9]{4}\.[0-9]{6})/i,
    headerPattern: /BRADESCO\s+SEGUROS/i,
    premiumPattern: /Prêmio\s+Total.*?R\$\s*([0-9\.,]+)/i
  },

  "Porto Seguro": {
    policyPattern: /PORTO.*?Apólice\s*[:\s]*([0-9\.\-]+)/i,
    headerPattern: /PORTO\s+SEGURO/i,
    vigencyPattern: /Vigência.*?de\s+(\d{2}\/\d{2}\/\d{4}).*?até\s+(\d{2}\/\d{2}\/\d{4})/i
  }
};
