
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';

// Função auxiliar para mapear o status
const mapStatus = (status: string | undefined): string => {
  if (!status) return 'vigente';

  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('ativo') || lowerStatus.includes('vigente') || lowerStatus.includes('ativa')) {
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
    return 'pendente'; // Considerando vencidas como pendentes
  } else {
    return 'pendente';
  }
};

// Função para gerar parcelas a partir dos dados do N8N
const generateInstallmentsFromN8NData = (data: any): Array<{numero: number, valor: number, data: string, status: 'paga' | 'pendente'}> => {
  const installments = [];
  
  // Se temos vencimentos_futuros e valor_parcela, usar esses dados
  if (data.vencimentos_futuros && Array.isArray(data.vencimentos_futuros) && data.valor_parcela) {
    data.vencimentos_futuros.forEach((vencimento: string, index: number) => {
      installments.push({
        numero: index + 1,
        valor: Number(data.valor_parcela),
        data: vencimento,
        status: analyzeInstallmentStatus(vencimento)
      });
    });
  }
  // Se não temos vencimentos_futuros mas temos numero de parcelas, gerar baseado na data de início
  else if (data.parcelas && typeof data.parcelas === 'number' && data.valor_parcela) {
    const startDate = new Date(data.inicio || new Date());
    const numberOfInstallments = Number(data.parcelas);
    const installmentValue = Number(data.valor_parcela);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: installmentValue,
        data: installmentDate.toISOString().split('T')[0],
        status: analyzeInstallmentStatus(installmentDate.toISOString().split('T')[0])
      });
    }
  }
  // Se parcelas é um array (formato antigo)
  else if (Array.isArray(data.parcelas)) {
    data.parcelas.forEach((parcela: any, index: number) => {
      installments.push({
        numero: index + 1,
        valor: Number(parcela.valor) || 0,
        data: parcela.data_vencimento,
        status: analyzeInstallmentStatus(parcela.data_vencimento)
      });
    });
  }
  
  return installments;
};

// Função para converter dados do N8N para o formato ParsedPolicyData
export const convertN8NData = (data: any, userId?: string): ParsedPolicyData => {
  // CORREÇÃO: Usar PolicyTypeNormalizer para normalizar tipo corretamente
  const normalizedType = PolicyTypeNormalizer.normalizeType(data.tipo_seguro || data.tipo);
  
  // CORREÇÃO CRÍTICA: Garantir que user_id seja sempre definido
  if (!userId && !data.user_id) {
    console.error('❌ ERRO CRÍTICO: user_id não fornecido para convertN8NData');
    console.error('Dados recebidos:', data);
    throw new Error('user_id é obrigatório para processar dados do N8N');
  }
  
  const finalUserId = userId || data.user_id;
  console.log(`✅ convertN8NData: Usando userId: ${finalUserId}`);
  
  return {
    id: crypto.randomUUID(),
    name: data.segurado || 'Segurado não informado',
    type: normalizedType,
    insurer: data.seguradora || 'Seguradora não informada',
    premium: Number(data.valor_premio || data.premio) || 0,
    monthlyAmount: Number(data.custo_mensal || data.valor_parcela) || 0,
    startDate: data.inicio_vigencia || data.inicio || new Date().toISOString().split('T')[0],
    endDate: data.fim_vigencia || data.fim || new Date().toISOString().split('T')[0],
    policyNumber: data.numero_apolice || 'N/A',
    paymentFrequency: data.forma_pagamento || data.pagamento || 'mensal',
    status: mapStatus(data.status),
    extractedAt: new Date().toISOString(),

    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.fim_vigencia || data.fim || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',

    // Campos específicos do N8N
    insuredName: data.segurado,
    documento: data.documento,
    documento_tipo: data.documento_tipo as 'CPF' | 'CNPJ',
    vehicleModel: data.modelo_veiculo,
    uf: data.uf,
    deductible: Number(data.franquia) || undefined,

    // Parcelas com tratamento adequado para diferentes formatos
    installments: generateInstallmentsFromN8NData(data),

    // CORREÇÃO PRINCIPAL: Coberturas com LMI - garantir formato correto
    coberturas: data.coberturas?.map((cobertura: any) => ({
      descricao: cobertura.descricao || cobertura.tipo,
      lmi: Number(cobertura.lmi) || undefined
    })) || [],

    // Campos de compatibilidade
    entity: data.corretora || 'Não informado',
    category: normalizedType === 'auto' ? 'Veicular' : 
             normalizedType === 'empresarial' ? 'Empresarial' : 'Outros',
    coverage: data.coberturas?.map((c: any) => c.descricao || c.tipo) || [],
    totalCoverage: Number(data.valor_premio || data.premio) || 0
  };
};

// CORREÇÃO CRÍTICA: Função para converter dados diretos do N8N com userId correto
export const convertN8NDirectData = (data: any, fileName: string, file: File, userId?: string): ParsedPolicyData => {
  console.log('🔄 convertN8NDirectData chamado com dados:', data);
  
  // CORREÇÃO CRÍTICA: Garantir que user_id seja sempre definido
  if (!userId && !data.user_id) {
    console.error('❌ ERRO CRÍTICO: user_id não fornecido para convertN8NDirectData');
    console.error('Dados recebidos:', data);
    throw new Error('user_id é obrigatório para processar dados diretos do N8N');
  }
  
  const finalUserId = userId || data.user_id;
  console.log(`✅ convertN8NDirectData: Usando userId: ${finalUserId}`);
  
  // CORREÇÃO: Usar PolicyTypeNormalizer para normalizar tipo corretamente
  const normalizedType = PolicyTypeNormalizer.normalizeType(data.tipo_seguro || data.tipo);
  
  const convertedPolicy: ParsedPolicyData = {
    id: crypto.randomUUID(),
    name: data.segurado || fileName.replace('.pdf', ''),
    type: normalizedType,
    insurer: data.seguradora || 'Seguradora não informada',
    premium: Number(data.premio) || 0,
    monthlyAmount: Number(data.custo_mensal || data.valor_parcela) || 0,
    startDate: data.inicio || new Date().toISOString().split('T')[0],
    endDate: data.fim || new Date().toISOString().split('T')[0],
    policyNumber: data.numero_apolice || 'N/A',
    paymentFrequency: data.pagamento || 'mensal',
    status: mapStatus(data.status),
    file,
    extractedAt: new Date().toISOString(),
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.fim || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',
    
    // Campos específicos do N8N
    insuredName: data.segurado,
    documento: data.documento,
    documento_tipo: data.documento_tipo as 'CPF' | 'CNPJ',
    vehicleModel: data.modelo_veiculo,
    uf: data.uf,
    deductible: Number(data.franquia) || undefined,

    // CORREÇÃO PRINCIPAL: Parcelas com tratamento robusto para diferentes formatos
    installments: generateInstallmentsFromN8NData(data),

    // CORREÇÃO PRINCIPAL: Coberturas com LMI - garantir formato correto
    coberturas: data.coberturas?.map((cobertura: any) => ({
      descricao: cobertura.descricao || cobertura.tipo,
      lmi: Number(cobertura.lmi) || undefined
    })) || [],

    // Campos de compatibilidade
    entity: data.corretora || 'Não informado',
    category: normalizedType === 'auto' ? 'Veicular' : 
             normalizedType === 'empresarial' ? 'Empresarial' : 'Outros',
    coverage: data.coberturas?.map((c: any) => c.descricao || c.tipo) || [],
    totalCoverage: Number(data.premio) || 0
  };

  console.log('✅ Política convertida:', convertedPolicy);
  return convertedPolicy;
};

export class N8NDataConverter {
  static convertN8NDirectData = convertN8NDirectData;
  static convertN8NData = convertN8NData;
}
