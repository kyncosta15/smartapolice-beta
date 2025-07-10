import { ParsedPolicyData } from '@/utils/policyDataParser';

// Função para normalizar o tipo de seguro
const normalizeInsuranceType = (type: string | undefined): string => {
  if (!type) return 'auto';

  const lowerType = type.toLowerCase();

  if (lowerType.includes('vida')) {
    return 'vida';
  } else if (lowerType.includes('saúde') || lowerType.includes('saude')) {
    return 'saude';
  } else if (lowerType.includes('patrimonial')) {
    return 'patrimonial';
  } else if (lowerType.includes('empresarial')) {
    return 'empresarial';
  }

  return 'auto';
};

// Função para gerar parcelas
const generateInstallments = (monthlyAmount: number, numberOfInstallments: any, startDate: string) => {
  const numInstallments = typeof numberOfInstallments === 'string' ? parseInt(numberOfInstallments, 10) : numberOfInstallments;

  if (isNaN(numInstallments) || numInstallments <= 0) {
    return [{
      numero: 1,
      valor: monthlyAmount,
      data: startDate || new Date().toISOString().split('T')[0],
      status: 'pendente'
    }];
  }

  const installments = [];
  const baseDate = startDate ? new Date(startDate) : new Date();

  for (let i = 0; i < numInstallments; i++) {
    const installmentDate = new Date(baseDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);

    installments.push({
      numero: i + 1,
      valor: monthlyAmount,
      data: installmentDate.toISOString().split('T')[0],
      status: installmentDate < new Date() ? 'paga' : 'pendente'
    });
  }

  return installments;
};

// Função para processar dados de cobertura do N8N
const processCoverageData = (coberturas: any) => {
  if (!coberturas || !Array.isArray(coberturas)) {
    return [];
  }

  return coberturas.map((cobertura: any) => ({
    descricao: cobertura.descricao || '',
    lmi: cobertura.lmi || 0
  }));
};

export const N8nWebhookService = {
  processWebhookData: (data: any) => {
    console.log('🔍 N8N Webhook - Processando dados recebidos:', data);
    
    try {
      if (!data) {
        throw new Error('Dados do webhook N8N ausentes');
      }

      if (typeof data !== 'object') {
        throw new Error('Dados do webhook N8N devem ser um objeto');
      }

      // Processar coberturas corretamente
      const processedCoberturas = processCoverageData(data.coberturas);
      
      console.log('🔍 Coberturas processadas:', processedCoberturas);

      // Estrutura final dos dados processados
      const processedData: ParsedPolicyData = {
        id: `n8n-${Date.now()}`,
        name: data.segurado || data.nome || 'Apólice N8N',
        type: normalizeInsuranceType(data.tipo_seguro),
        insurer: data.seguradora || 'Não informado',
        premium: parseFloat(data.valor_premio) || 0,
        monthlyAmount: parseFloat(data.custo_mensal) || parseFloat(data.valor_parcela) || 0,
        startDate: data.inicio_vigencia || new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        policyNumber: data.numero_apolice || 'N/A',
        paymentFrequency: data.forma_pagamento || 'mensal',
        status: 'active',
        
        // Campos específicos do N8N
        insuredName: data.segurado,
        documento: data.documento,
        documento_tipo: data.documento_tipo,
        vehicleModel: data.modelo_veiculo,
        uf: data.uf,
        deductible: parseFloat(data.franquia) || undefined,
        
        // Coberturas processadas
        coberturas: processedCoberturas,
        
        // Parcelas
        installments: generateInstallments(
          parseFloat(data.custo_mensal) || parseFloat(data.valor_parcela) || 0,
          data.quantidade_parcelas || 12,
          data.inicio_vigencia
        ),
        
        // Campos de compatibilidade
        entity: 'N8N Integration',
        category: data.tipo_seguro === 'auto' ? 'Veicular' : 
                 data.tipo_seguro === 'vida' ? 'Pessoal' : 
                 data.tipo_seguro === 'saude' ? 'Saúde' : 'Geral',
        coverage: processedCoberturas.map(c => c.descricao),
        totalCoverage: parseFloat(data.valor_premio) || 0,
        limits: 'Conforme apólice'
      };

      console.log('✅ N8N Webhook - Dados processados com sucesso:', processedData);
      return processedData;

    } catch (error) {
      console.error('❌ N8N Webhook - Erro ao processar dados:', error);
      throw new Error(`Erro no processamento N8N: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
};
