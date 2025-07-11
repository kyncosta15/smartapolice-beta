
import { ParsedPolicyData } from '@/utils/policyDataParser';

// Função auxiliar para normalizar o tipo de seguro
const normalizeType = (type: string | undefined): string => {
  if (!type) return 'auto';

  const lowerType = type.toLowerCase();

  if (lowerType.includes('auto') || lowerType.includes('carro') || lowerType.includes('veículo')) {
    return 'auto';
  } else if (lowerType.includes('vida')) {
    return 'vida';
  } else if (lowerType.includes('residencial') || lowerType.includes('casa')) {
    return 'residencial';
  } else if (lowerType.includes('saúde') || lowerType.includes('saude')) {
    return 'saude';
  } else if (lowerType.includes('acidentes pessoais') || lowerType.includes('acidentes')) {
    return 'acidentes_pessoais';
  } else {
    return 'outros';
  }
};

// Função auxiliar para mapear o status
const mapStatus = (status: string | undefined): string => {
  if (!status) return 'vigente';

  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('ativo') || lowerStatus.includes('vigente')) {
    return 'vigente';
  } else if (lowerStatus.includes('pendente')) {
    return 'pendente_analise';
  } else if (lowerStatus.includes('renovada') || lowerStatus.includes('aguardando')) {
    return 'aguardando_emissao';
  } else if (lowerStatus.includes('cancelado') || lowerStatus.includes('nao renovada') || lowerStatus.includes('não renovada')) {
    return 'nao_renovada';
  } else {
    return 'vigente';
  }
};

// Função para analisar o status da parcela
const analyzeInstallmentStatus = (dueDate: string): 'paga' | 'pendente' => {
  const today = new Date();
  const parsedDueDate = new Date(dueDate);

  if (parsedDueDate < today) {
    return 'pendente';
  } else {
    return 'pendente';
  }
};

// Função para converter dados do N8N para o formato ParsedPolicyData
export const convertN8NData = (data: any): ParsedPolicyData => {

  return {
    id: crypto.randomUUID(),
    name: data.segurado || 'Segurado não informado',
    type: normalizeType(data.tipo_seguro),
    insurer: data.seguradora || 'Seguradora não informada',
    premium: Number(data.valor_premio) || 0,
    monthlyAmount: Number(data.custo_mensal) || 0,
    startDate: data.inicio_vigencia || new Date().toISOString().split('T')[0],
    endDate: data.fim_vigencia || new Date().toISOString().split('T')[0],
    policyNumber: data.numero_apolice || 'N/A',
    paymentFrequency: data.forma_pagamento || 'mensal',
    status: mapStatus(data.status),
    extractedAt: new Date().toISOString(),

    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.fim_vigencia || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',

    // Campos específicos do N8N
    insuredName: data.segurado,
    documento: data.documento,
    documento_tipo: data.documento_tipo as 'CPF' | 'CNPJ',
    vehicleModel: data.modelo_veiculo,
    uf: data.uf,
    deductible: Number(data.franquia) || undefined,

    // Parcelas com status analisado
    installments: data.parcelas?.map((parcela: any, index: number) => ({
      numero: index + 1,
      valor: Number(parcela.valor) || 0,
      data: parcela.data_vencimento,
      status: analyzeInstallmentStatus(parcela.data_vencimento)
    })) || [],

    // Coberturas com LMI
    coberturas: data.coberturas?.map((cobertura: any) => ({
      descricao: cobertura.tipo || cobertura.descricao,
      lmi: Number(cobertura.lmi) || undefined
    })) || [],

    // Campos de compatibilidade
    entity: data.corretora || 'Não informado',
    category: data.tipo_seguro === 'auto' ? 'Veicular' : 'Outros',
    coverage: data.coberturas?.map((c: any) => c.tipo || c.descricao) || [],
    totalCoverage: Number(data.valor_premio) || 0
  };
};

// Função para converter dados diretos do N8N
export const convertN8NDirectData = (data: any, fileName: string, file: File): ParsedPolicyData => {
  return {
    id: crypto.randomUUID(),
    name: data.segurado || fileName.replace('.pdf', ''),
    type: normalizeType(data.tipo_seguro),
    insurer: data.seguradora || 'Seguradora não informada',
    premium: Number(data.valor_premio) || 0,
    monthlyAmount: Number(data.custo_mensal) || 0,
    startDate: data.inicio_vigencia || new Date().toISOString().split('T')[0],
    endDate: data.fim_vigencia || new Date().toISOString().split('T')[0],
    policyNumber: data.numero_apolice || 'N/A',
    paymentFrequency: data.forma_pagamento || 'mensal',
    status: mapStatus(data.status),
    file,
    extractedAt: new Date().toISOString(),
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.fim_vigencia || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',
    
    // Campos específicos do N8N
    insuredName: data.segurado,
    documento: data.documento,
    documento_tipo: data.documento_tipo as 'CPF' | 'CNPJ',
    vehicleModel: data.modelo_veiculo,
    uf: data.uf,
    deductible: Number(data.franquia) || undefined,

    // Parcelas com status analisado
    installments: data.parcelas?.map((parcela: any, index: number) => ({
      numero: index + 1,
      valor: Number(parcela.valor) || 0,
      data: parcela.data_vencimento,
      status: analyzeInstallmentStatus(parcela.data_vencimento)
    })) || [],

    // Coberturas com LMI
    coberturas: data.coberturas?.map((cobertura: any) => ({
      descricao: cobertura.tipo || cobertura.descricao,
      lmi: Number(cobertura.lmi) || undefined
    })) || [],

    // Campos de compatibilidade
    entity: data.corretora || 'Não informado',
    category: data.tipo_seguro === 'auto' ? 'Veicular' : 'Outros',
    coverage: data.coberturas?.map((c: any) => c.tipo || c.descricao) || [],
    totalCoverage: Number(data.valor_premio) || 0
  };
};

export class N8NDataConverter {
  static convertN8NDirectData = convertN8NDirectData;
  static convertN8NData = convertN8NData;
}
