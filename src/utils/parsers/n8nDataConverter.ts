
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';

// Função auxiliar para determinar status baseado nas datas de vigência
const determineStatusFromDates = (endDate: string, startDate?: string): string => {
  if (!endDate) return 'vigente';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  
  const expDate = new Date(endDate);
  expDate.setHours(0, 0, 0, 0);
  
  if (isNaN(expDate.getTime())) {
    console.error(`❌ Data de expiração inválida: ${endDate}`);
    return 'vigente';
  }
  
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const expYear = expDate.getFullYear();
  
  console.log(`📅 [N8N] Analisando vigência - Fim: ${endDate}, Dias: ${diffDays}, Ano exp: ${expYear}`);
  
  // REGRA: Apólices com vigência fora do ano atual são "antigas" (não renovadas)
  if (expYear < currentYear) {
    console.log(`📅 [N8N] Apólice ANTIGA: vigência terminou em ${expYear} (atual: ${currentYear})`);
    return 'nao_renovada';
  }
  
  // Se início é anterior ao ano atual E já venceu, também é antiga
  if (startDate) {
    const startDateObj = new Date(startDate);
    const startYear = startDateObj.getFullYear();
    if (startYear < currentYear && diffDays < 0) {
      console.log(`📅 [N8N] Apólice ANTIGA: iniciou em ${startYear} e já venceu`);
      return 'nao_renovada';
    }
  }
  
  if (diffDays < -30) {
    return 'nao_renovada';
  } else if (diffDays < 0) {
    return 'vencida';
  } else if (diffDays <= 30) {
    return 'vencendo';
  } else {
    return 'vigente';
  }
};

// Função auxiliar para analisar o status da parcela
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
  
  // Usar custo_mensal como valor prioritário da parcela
  const valorParcela = Number(data.custo_mensal) || Number(data.valor_parcela) || (Number(data.premio) / Number(data.parcelas)) || 0;
  
  console.log('📊 Processando parcelas N8N:', {
    vencimentos_futuros: data.vencimentos_futuros,
    parcelas: data.parcelas,
    custo_mensal: data.custo_mensal,
    valorParcela
  });
  
  // PRIORIDADE 1: Se temos vencimentos_futuros do N8N, usar exatamente como recebido
  if (data.vencimentos_futuros && Array.isArray(data.vencimentos_futuros) && data.vencimentos_futuros.length > 0) {
    console.log('✅ Usando vencimentos_futuros do N8N');
    data.vencimentos_futuros.forEach((vencimento: any, index: number) => {
      let dataVencimento: string;
      let valorVencimento = valorParcela;
      
      // Processar diferentes formatos de vencimento
      if (typeof vencimento === 'string') {
        dataVencimento = vencimento;
      } else if (vencimento && typeof vencimento === 'object') {
        dataVencimento = vencimento.data || vencimento.date || vencimento.vencimento;
        valorVencimento = Number(vencimento.valor) || Number(vencimento.value) || valorParcela;
      } else {
        // Fallback para datas mensais
        const baseDate = new Date(data.inicio || new Date());
        baseDate.setMonth(baseDate.getMonth() + index);
        dataVencimento = baseDate.toISOString().split('T')[0];
      }
      
      installments.push({
        numero: index + 1,
        valor: Math.round(valorVencimento * 100) / 100,
        data: dataVencimento,
        status: analyzeInstallmentStatus(dataVencimento)
      });
    });
  }
  // PRIORIDADE 2: Usar número de parcelas do N8N
  else if (data.parcelas && Number(data.parcelas) > 0) {
    console.log('✅ Gerando parcelas baseado no número informado pelo N8N');
    const numParcelas = Number(data.parcelas);
    const startDate = new Date(data.inicio || new Date());
    
    for (let i = 0; i < numParcelas; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: Math.round(valorParcela * 100) / 100,
        data: installmentDate.toISOString().split('T')[0],
        status: analyzeInstallmentStatus(installmentDate.toISOString().split('T')[0])
      });
    }
  }
  // FALLBACK: Parcela única
  else {
    console.log('⚠️ Criando parcela única de fallback');
    const startDate = new Date(data.inicio || new Date());
    installments.push({
      numero: 1,
      valor: Math.round((Number(data.premio) || 0) * 100) / 100,
      data: startDate.toISOString().split('T')[0],
      status: 'pendente' as const
    });
  }
  
  console.log('✅ Parcelas geradas:', installments);
  return installments;
};

// Função para converter dados do N8N para o formato ParsedPolicyData
export const convertN8NData = (data: any, userId?: string): ParsedPolicyData => {
  // CORREÇÃO CRÍTICA: Garantir que user_id seja sempre definido
  if (!userId && !data.user_id) {
    console.error('❌ ERRO CRÍTICO: user_id não fornecido para convertN8NData');
    console.error('Dados recebidos:', data);
    throw new Error('user_id é obrigatório para processar dados do N8N');
  }
  
  const finalUserId = userId || data.user_id;
  console.log(`✅ convertN8NData: Usando userId: ${finalUserId}`);
  
  // CORREÇÃO: Usar PolicyTypeNormalizer para normalizar tipo corretamente
  const normalizedType = PolicyTypeNormalizer.normalizeType(data.tipo_seguro || data.tipo);
  
  // CORREÇÃO: Calcular custo mensal baseado nos dados disponíveis
  const totalParcelas = Number(data.parcelas) || 1;
  const valorPremio = Number(data.premio) || 0;
  const valorParcela = Number(data.valor_parcela) || (totalParcelas > 0 ? valorPremio / totalParcelas : valorPremio);
  const custoMensal = Number(data.custo_mensal) || valorParcela;
  
  return {
    id: window.crypto.randomUUID(),
    name: data.segurado || 'Segurado não informado',
    type: normalizedType,
    insurer: data.seguradora || 'Seguradora não informada',
    premium: valorPremio,
    monthlyAmount: custoMensal,
    startDate: data.inicio_vigencia || data.inicio || new Date().toISOString().split('T')[0],
    endDate: data.fim_vigencia || data.fim || new Date().toISOString().split('T')[0],
    policyNumber: data.numero_apolice || `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    paymentFrequency: data.forma_pagamento || data.pagamento || 'mensal',
    // CORREÇÃO: Determinar status baseado nas datas de vigência (antigas = nao_renovada)
    status: determineStatusFromDates(
      data.fim_vigencia || data.fim,
      data.inicio_vigencia || data.inicio
    ),
    extractedAt: new Date().toISOString(),

    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.fim_vigencia || data.fim || new Date().toISOString().split('T')[0],
    policyStatus: determineStatusFromDates(
      data.fim_vigencia || data.fim,
      data.inicio_vigencia || data.inicio
    ) as 'vigente' | 'aguardando_emissao' | 'nao_renovada' | 'vencida' | 'pendente_analise' | 'vencendo',

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
    totalCoverage: valorPremio,

    // Preservar vencimentos_futuros raw para salvar em apolice_parcelas
    vencimentos_futuros: data.vencimentos_futuros || [],
  } as ParsedPolicyData;
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
  
  // CORREÇÃO: Mapear campos com diferentes nomes possíveis do N8N
  const segurado = data.segurado || data.num_segurado || data.nome_segurado || fileName.replace('.pdf', '');
  const seguradora = data.seguradora || data.num_seguradora || data.nome_seguradora || 'Seguradora não informada';
  const numeroApolice = data.numero_apolice || data.num_apolice || data.apolice || `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const tipoSeguro = data.tipo_seguro || data.tipo || 'auto';
  const inicio = data.inicio || data.inicio_vigencia || data.data_inicio || new Date().toISOString().split('T')[0];
  const fim = data.fim || data.fim_vigencia || data.data_fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const premio = Number(data.premio) || Number(data.valor_premio) || Number(data.premio_total) || 0;
  const parcelas = Number(data.parcelas) || Number(data.num_parcelas) || 1;
  
  // CORREÇÃO: Usar PolicyTypeNormalizer para normalizar tipo corretamente
  const normalizedType = PolicyTypeNormalizer.normalizeType(tipoSeguro);
  
  // CORREÇÃO: Calcular valores financeiros corretamente
  const valorParcela = Number(data.valor_parcela) || (parcelas > 0 ? premio / parcelas : premio);
  const custoMensal = Number(data.custo_mensal) || valorParcela;
  
  const convertedPolicy: ParsedPolicyData = {
    id: window.crypto.randomUUID(),
    name: segurado,
    type: normalizedType,
    insurer: seguradora,
    premium: premio,
    monthlyAmount: custoMensal,
    startDate: inicio,
    endDate: fim,
    policyNumber: numeroApolice,
    paymentFrequency: data.pagamento || data.forma_pagamento || 'mensal',
    // CORREÇÃO: Determinar status baseado nas datas de vigência (antigas = nao_renovada)
    status: determineStatusFromDates(fim, inicio),
    file,
    extractedAt: new Date().toISOString(),
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: fim,
    policyStatus: determineStatusFromDates(fim, inicio) as 'vigente' | 'aguardando_emissao' | 'nao_renovada' | 'vencida' | 'pendente_analise' | 'vencendo',
    
    // Campos específicos do N8N
    insuredName: segurado,
    documento: data.documento || data.cpf || data.cnpj,
    documento_tipo: data.documento_tipo as 'CPF' | 'CNPJ',
    vehicleModel: data.modelo_veiculo || data.modelo,
    uf: data.uf || data.estado,
    deductible: Number(data.franquia) || undefined,

    // CORREÇÃO PRINCIPAL: Parcelas com tratamento robusto para diferentes formatos
    installments: generateInstallmentsFromN8NData(data),

    // CORREÇÃO PRINCIPAL: Coberturas com LMI - garantir formato correto
    coberturas: data.coberturas?.map((cobertura: any) => ({
      descricao: cobertura.descricao || cobertura.tipo || cobertura.nome,
      lmi: Number(cobertura.lmi) || Number(cobertura.valor) || undefined
    })) || [],

    // Campos de compatibilidade
    entity: data.corretora || data.corretor || 'Não informado',
    category: normalizedType === 'auto' ? 'Veicular' : 
             normalizedType === 'empresarial' ? 'Empresarial' : 'Outros',
    coverage: data.coberturas?.map((c: any) => c.descricao || c.tipo || c.nome) || [],
    totalCoverage: premio,

    // Preservar vencimentos_futuros raw para salvar em apolice_parcelas
    vencimentos_futuros: data.vencimentos_futuros || [],
  } as ParsedPolicyData;
  console.log('✅ Política convertida:', convertedPolicy);
  return convertedPolicy;
};

export class N8NDataConverter {
  static convertN8NDirectData = convertN8NDirectData;
  static convertN8NData = convertN8NData;
}
