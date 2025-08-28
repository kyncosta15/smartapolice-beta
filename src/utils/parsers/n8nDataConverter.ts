
import { ParsedPolicyData } from '@/utils/policyDataParser';

export interface N8NDirectData {
  user_id?: string | null;
  segurado: string;
  documento: string;
  documento_tipo: 'CPF' | 'CNPJ';
  data_nascimento?: string;
  seguradora: string;
  numero_apolice: string;
  inicio: string;
  fim: string;
  tipo: string;
  modelo_veiculo?: string;
  placa?: string;
  ano_modelo?: string;
  premio: number;
  parcelas: number;
  valor_parcela: number;
  pagamento: string;
  custo_mensal: number;
  vencimentos_futuros?: any[];
  franquia?: number;
  condutor?: string;
  email?: string;
  telefone?: string;
  status: string;
  corretora: string;
  cidade?: string;
  uf: string;
  coberturas: Array<{
    descricao: string;
    lmi: number;
  }>;
}

export class N8NDataConverter {
  // Mapear status do N8N para status do sistema
  private static mapStatus(n8nStatus: string): string {
    const statusMap: Record<string, string> = {
      'Ativa': 'vigente',
      'ativa': 'vigente',
      'Active': 'vigente',
      'active': 'vigente',
      'Vencida': 'vencida',
      'vencida': 'vencida',
      'Expired': 'vencida',
      'expired': 'vencida',
      'Pendente': 'pendente_analise',
      'pendente': 'pendente_analise',
      'Renovação': 'aguardando_emissao',
      'renovacao': 'aguardando_emissao'
    };
    
    return statusMap[n8nStatus] || 'vigente';
  }

  // Normalizar tipo de seguro
  private static normalizeInsuranceType(tipo: string): string {
    const typeMap: Record<string, string> = {
      'Automóvel': 'auto',
      'automovel': 'auto',
      'Auto': 'auto',
      'auto': 'auto',
      'Vida': 'vida',
      'vida': 'vida',
      'Saúde': 'saude',
      'saude': 'saude',
      'Empresarial': 'empresarial',
      'empresarial': 'empresarial'
    };
    
    return typeMap[tipo] || 'auto';
  }

  static convertN8NDirectData(
    data: N8NDirectData, 
    fileName: string, 
    file?: File,
    userIdOverride?: string
  ): ParsedPolicyData {
    console.log('🔄 Convertendo dados diretos do N8N:', data);
    
    // CRÍTICO: Garantir que sempre temos um userId válido
    const finalUserId = userIdOverride || data.user_id;
    if (!finalUserId) {
      console.error('❌ ERRO CRÍTICO: userId não fornecido para conversão N8N');
      throw new Error('userId é obrigatório para conversão de dados N8N');
    }

    // Gerar ID único para a apólice
    const policyId = crypto.randomUUID();
    
    // Converter status
    const mappedStatus = this.mapStatus(data.status);
    const normalizedType = this.normalizeInsuranceType(data.tipo);
    
    // Calcular valor mensal corretamente baseado nos dados reais do N8N
    let monthlyAmount = 0;
    
    if (data.custo_mensal > 0) {
      // Se custo_mensal está definido, usar este valor
      monthlyAmount = data.custo_mensal;
    } else if (data.parcelas > 0 && data.valor_parcela > 0) {
      // Se há parcelas definidas, usar valor_parcela
      monthlyAmount = data.valor_parcela;
    } else if (data.premio > 0) {
      // Caso contrário, dividir prêmio por 12 meses
      monthlyAmount = data.premio / 12;
    }
    
    console.log('💰 Cálculo do valor mensal:', {
      custo_mensal: data.custo_mensal,
      parcelas: data.parcelas,
      valor_parcela: data.valor_parcela,
      premio: data.premio,
      monthlyAmount_calculado: monthlyAmount
    });
    
    // Processar coberturas - manter LMI como está no N8N (0 ou valor real)
    const coberturas = Array.isArray(data.coberturas) ? data.coberturas.map(cobertura => ({
      id: crypto.randomUUID(),
      descricao: cobertura.descricao,
      lmi: cobertura.lmi || undefined // Converter 0 para undefined
    })) : [];

    // Gerar parcelas baseado nos dados reais
    let installments = [];
    let quantidade_parcelas = 0;
    
    if (data.parcelas > 0) {
      // Se há parcelas definidas, usar os dados do N8N
      quantidade_parcelas = data.parcelas;
      const valorParcela = data.valor_parcela > 0 ? data.valor_parcela : monthlyAmount;
      installments = this.generateInstallments(data.parcelas, valorParcela, data.inicio);
    } else {
      // Se não há parcelas, assumir pagamento à vista ou criar parcelas mensais
      quantidade_parcelas = 1; // Pagamento à vista
      if (monthlyAmount > 0) {
        // Criar uma única parcela com o valor total
        installments = [{
          numero: 1,
          valor: data.premio,
          data: data.inicio,
          status: 'pendente' as const
        }];
      }
    }

    const convertedPolicy: ParsedPolicyData = {
      id: policyId,
      name: `Apólice ${data.segurado}`,
      type: normalizedType,
      insurer: data.seguradora,
      premium: data.premio,
      monthlyAmount: monthlyAmount,
      startDate: data.inicio,
      endDate: data.fim,
      expirationDate: data.fim,
      policyNumber: data.numero_apolice,
      paymentFrequency: data.pagamento || 'mensal',
      status: mappedStatus,
      policyStatus: mappedStatus as any,
      file: file,
      extractedAt: new Date().toISOString(),
      
      // Dados específicos do N8N
      insuredName: data.segurado,
      documento: data.documento,
      documento_tipo: data.documento_tipo,
      vehicleModel: data.modelo_veiculo,
      uf: data.uf,
      deductible: data.franquia,
      entity: data.corretora,
      
      // Parcelas e coberturas
      installments: installments,
      coberturas: coberturas,
      quantidade_parcelas: quantidade_parcelas,
      
      // Campos de compatibilidade
      category: normalizedType === 'auto' ? 'Veicular' : 
               normalizedType === 'vida' ? 'Pessoal' : 
               normalizedType === 'saude' ? 'Saúde' : 
               normalizedType === 'empresarial' ? 'Empresarial' : 'Geral',
      coverage: coberturas.map(c => c.descricao),
      totalCoverage: data.premio,
      
      // Dados do veículo se disponível
      vehicleDetails: data.modelo_veiculo ? {
        model: data.modelo_veiculo,
        year: data.ano_modelo ? parseInt(data.ano_modelo) : undefined,
        plate: data.placa
      } : undefined
    };

    console.log('✅ Conversão N8N concluída:', {
      id: convertedPolicy.id,
      name: convertedPolicy.name,
      status: convertedPolicy.status,
      coberturas: convertedPolicy.coberturas?.length || 0,
      monthlyAmount: convertedPolicy.monthlyAmount,
      quantidade_parcelas: convertedPolicy.quantidade_parcelas,
      premium: convertedPolicy.premium
    });

    return convertedPolicy;
  }

  private static generateInstallments(
    numberOfInstallments: number,
    installmentValue: number,
    startDate: string
  ) {
    const installments = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: installmentValue,
        data: installmentDate.toISOString().split('T')[0],
        status: installmentDate < new Date() ? 'paga' : 'pendente'
      });
    }
    
    return installments;
  }
}
