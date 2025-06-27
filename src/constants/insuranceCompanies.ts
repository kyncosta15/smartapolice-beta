
import { InsurerConfig } from '@/types/insurerConfig';

export const INSURANCE_COMPANIES = [
  "Porto Seguro",
  "Bradesco Seguros", 
  "SulAmérica",
  "Itaú Seguros",
  "Mapfre",
  "Allianz",
  "Liberty Seguros",
  "HDI Seguros",
  "Tokio Marine",
  "Sompo Seguros",
  "Zurich",
  "Azul Seguros",
  "Alfa Seguradora",
  "Suhai Seguradora",
  "Excelsior Seguros",
  "Too Seguros",
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

export const INSURER_CONFIGS: InsurerConfig[] = [
  {
    name: "Liberty Seguros",
    keywords: ["liberty", "liberty seguros"],
    patterns: {
      policyNumber: /Apólice\s*(?:n[°º]?)?\s*([0-9.]+)/i,
      annualPremium: /Prêmio\s+Total\s*\(R\$\)\s*([\d.,]+)/i,
      monthlyPremium: /\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+([\d.,]+)/i,
      startDate: /Início\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
      endDate: /(?:Fim|Final)\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
      insuredName: /DADOS\s+DO\s+SEGURADO.*?Nome.*?([A-ZÁÊÔÃÇ\s]+)/i,
      vehicleBrand: /Marca.*?([A-Z]+)/i,
      vehicleModel: /Modelo.*?([A-Z0-9\s\/.-]+)/i,
      brokerSection: /DADOS\s+DO\s+CORRETOR.*?emitido\s+por\s+([A-ZÁÊÔÃÇ\s&]+)/i
    },
    defaultCategory: "Auto Consciente",
    defaultCoverage: "Responsabilidade Civil Facultativa"
  },
  {
    name: "Bradesco Seguros",
    keywords: ["bradesco", "bradesco seguros"],
    patterns: {
      policyNumber: /(?:Apólice|Número).*?(\d{4}\.\d{3}\.\d{4}\.\d{6})/i,
      annualPremium: /Prêmio\s+Total\s*\(R\$\)\s*([\d.,]+)/i,
      monthlyPremium: /\d{2}\s+parcelas.*?R\$\s*([\d.,]+)/i,
      startDate: /Início.*?(\d{2}\/\d{2}\/\d{4})/i,
      endDate: /(?:Fim|Término).*?(\d{2}\/\d{2}\/\d{4})/i,
      insuredName: /Segurado.*?([A-ZÁÊÔÃÇ\s]+)/i,
      brokerSection: /emitido\s+por\s+([A-ZÁÊÔÃÇ\s&]+)/i
    },
    defaultCategory: "Auto Prime",
    defaultCoverage: "Compreensiva"
  },
  {
    name: "Porto Seguro",
    keywords: ["porto", "porto seguro"],
    patterns: {
      policyNumber: /Apólice.*?(\d+\.\d+\.\d+)/i,
      annualPremium: /Prêmio\s+Total\s*\(R\$\)\s*([\d.,]+)/i,
      monthlyPremium: /parcelas.*?R\$\s*([\d.,]+)/i,
      startDate: /Vigência.*?de\s+(\d{2}\/\d{2}\/\d{4})/i,
      endDate: /até\s+(\d{2}\/\d{2}\/\d{4})/i,
      brokerSection: /DADOS\s+DO\s+CORRETOR.*?([A-ZÁÊÔÃÇ\s&]+)/i
    },
    defaultCategory: "Azul Completo",
    defaultCoverage: "Cobertura Ampla"
  }
];
