
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';
import { extractFieldValue, extractNumericValue, inferDocumentType } from '@/utils/extractFieldValue';

// Função auxiliar para mapear o status
const mapStatus = (status: string | undefined): string => {
  const statusValue = extractFieldValue(status);
  if (!statusValue) return 'vigente';

  const lowerStatus = statusValue.toLowerCase();

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
  
  // CORREÇÃO: Usar extractFieldValue e extractNumericValue para valores seguros
  const numParcelas = extractNumericValue(data.parcelas) || 1;
  const valorParcela = extractNumericValue(data.valor_parcela) || extractNumericValue(data.premio) || 0;
  
  // Se temos vencimentos_futuros e valor_parcela, usar esses dados
  if (data.vencimentos_futuros && Array.isArray(data.vencimentos_futuros) && data.vencimentos_futuros.length > 0) {
    data.vencimentos_futuros.forEach((vencimento: string, index: number) => {
      installments.push({
        numero: index + 1,
        valor: valorParcela,
        data: vencimento,
        status: analyzeInstallmentStatus(vencimento)
      });
    });
  }
  // NOVA LÓGICA: Se não há vencimentos mas há parcelas > 0, gerar parcelas mensais
  else if (numParcelas > 0) {
    const startDate = new Date(extractFieldValue(data.inicio) || new Date());
    
    for (let i = 0; i < numParcelas; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: valorParcela,
        data: installmentDate.toISOString().split('T')[0],
        status: analyzeInstallmentStatus(installmentDate.toISOString().split('T')[0])
      });
    }
  }
  // FALLBACK: Criar ao menos uma parcela com o valor total
  else {
    const startDate = new Date(extractFieldValue(data.inicio) || new Date());
    installments.push({
      numero: 1,
      valor: extractNumericValue(data.premio) || 0,
      data: startDate.toISOString().split('T')[0],
      status: 'pendente' as const
    });
  }
  
  return installments;
};

// Função para converter dados do N8N para o formato ParsedPolicyData
export const convertN8NData = (data: any, userId?: string): ParsedPolicyData => {
  console.log('🔄 convertN8NData - dados recebidos:', JSON.stringify(data, null, 2));
  
  // CORREÇÃO CRÍTICA: Garantir que user_id seja sempre definido
  if (!userId && !data.user_id) {
    console.error('❌ ERRO CRÍTICO: user_id não fornecido para convertN8NData');
    console.error('Dados recebidos:', data);
    throw new Error('user_id é obrigatório para processar dados do N8N');
  }
  
  const finalUserId = userId || extractFieldValue(data.user_id);
  console.log(`✅ convertN8NData: Usando userId: ${finalUserId}`);
  
  // CORREÇÃO: Usar PolicyTypeNormalizer para normalizar tipo corretamente
  const tipoSeguro = extractFieldValue(data.tipo_seguro) || extractFieldValue(data.tipo) || 'auto';
  const normalizedType = PolicyTypeNormalizer.normalizeType(tipoSeguro);
  
  // CORREÇÃO: Extrair valores seguros usando extractFieldValue e extractNumericValue
  const segurado = extractFieldValue(data.segurado) || 'Segurado não informado';
  const seguradora = extractFieldValue(data.seguradora) || 'Seguradora não informada';
  const numeroApolice = extractFieldValue(data.numero_apolice) || extractFieldValue(data.apolice) || 'N/A';
  const documento = extractFieldValue(data.documento);
  const documentoTipo = inferDocumentType(documento);
  
  // CORREÇÃO: Calcular custo mensal baseado nos dados disponíveis
  const totalParcelas = extractNumericValue(data.parcelas) || 1;
  const valorPremio = extractNumericValue(data.premio) || 0;
  const valorParcela = extractNumericValue(data.valor_parcela) || (totalParcelas > 0 ? valorPremio / totalParcelas : valorPremio);
  const custoMensal = extractNumericValue(data.custo_mensal) || valorParcela;
  
  // Extrair datas de forma segura
  const inicioVigencia = extractFieldValue(data.inicio_vigencia) || extractFieldValue(data.inicio) || new Date().toISOString().split('T')[0];
  const fimVigencia = extractFieldValue(data.fim_vigencia) || extractFieldValue(data.fim) || new Date().toISOString().split('T')[0];
  
  // Processar coberturas se existirem
  let coberturas = [];
  if (data.coberturas && Array.isArray(data.coberturas)) {
    coberturas = data.coberturas.map((cobertura: any) => ({
      descricao: extractFieldValue(cobertura.descricao) || extractFieldValue(cobertura.tipo) || 'Cobertura',
      lmi: extractNumericValue(cobertura.lmi) || undefined
    }));
  }
  
  console.log('✅ Dados processados com extractFieldValue:', {
    segurado,
    seguradora,
    numeroApolice,
    normalizedType,
    valorPremio,
    custoMensal,
    documento,
    documentoTipo
  });

  return {
    id: crypto.randomUUID(),
    name: segurado,
    type: normalizedType,
    insurer: seguradora,
    premium: valorPremio,
    monthlyAmount: custoMensal,
    startDate: inicioVigencia,
    endDate: fimVigencia,
    policyNumber: numeroApolice,
    paymentFrequency: extractFieldValue(data.forma_pagamento) || extractFieldValue(data.pagamento) || 'mensal',
    status: mapStatus(data.status),
    extractedAt: new Date().toISOString(),

    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: fimVigencia,
    policyStatus: 'vigente',

    // Campos específicos do N8N
    insuredName: segurado,
    documento: documento,
    documento_tipo: documentoTipo,
    vehicleModel: extractFieldValue(data.modelo_veiculo),
    uf: extractFieldValue(data.uf),
    deductible: extractNumericValue(data.franquia) || undefined,

    // Parcelas com tratamento adequado para diferentes formatos
    installments: generateInstallmentsFromN8NData(data),

    // Coberturas processadas
    coberturas: coberturas,

    // Campos de compatibilidade
    entity: extractFieldValue(data.corretora) || 'Não informado',
    category: normalizedType === 'auto' ? 'Veicular' : 
             normalizedType === 'empresarial' ? 'Empresarial' : 'Outros',
    coverage: coberturas.map((c: any) => c.descricao) || [],
    totalCoverage: valorPremio
  };
};

// CORREÇÃO CRÍTICA: Função para converter dados diretos do N8N com userId correto
export const convertN8NDirectData = (data: any, fileName: string, file: File, userId?: string): ParsedPolicyData => {
  console.log('🔄 convertN8NDirectData chamado com dados:', JSON.stringify(data, null, 2));
  
  // CORREÇÃO CRÍTICA: Garantir que user_id seja sempre definido
  if (!userId && !data.user_id) {
    console.error('❌ ERRO CRÍTICO: user_id não fornecido para convertN8NDirectData');
    console.error('Dados recebidos:', data);
    throw new Error('user_id é obrigatório para processar dados diretos do N8N');
  }
  
  const finalUserId = userId || extractFieldValue(data.user_id);
  console.log(`✅ convertN8NDirectData: Usando userId: ${finalUserId}`);
  
  // Usar a função principal de conversão
  const convertedPolicy = convertN8NData(data, finalUserId);
  
  // Adicionar o arquivo e ajustar alguns campos específicos
  convertedPolicy.file = file;
  convertedPolicy.name = extractFieldValue(data.segurado) || fileName.replace('.pdf', '');

  console.log('✅ Política convertida (convertN8NDirectData):', convertedPolicy);
  return convertedPolicy;
};

export class N8NDataConverter {
  static convertN8NDirectData = convertN8NDirectData;
  static convertN8NData = convertN8NData;
}
