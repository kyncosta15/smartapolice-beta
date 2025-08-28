
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
    
    // Calcular valor mensal se não fornecido
    const monthlyAmount = data.custo_mensal || (data.parcelas > 0 ? data.premio / data.parcelas : data.valor_parcela);
    
    // Processar coberturas - garantir que sempre temos um array
    const coberturas = Array.isArray(data.coberturas) ? data.coberturas.map(cobertura => ({
      id: crypto.randomUUID(),
      descricao: cobertura.descricao,
      lmi: cobertura.lmi > 0 ? cobertura.lmi : undefined
    })) : [];

    // Gerar parcelas se necessário
    const installments = data.parcelas > 0 ? this.generateInstallments(
      data.parcelas,
      data.valor_parcela || monthlyAmount,
      data.inicio
    ) : [];

    const convertedPolicy: ParsedPolicyData = {
      id: policyId,
      name: `Apólice ${data.segurado.split(' ')[0]}`,
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
      quantidade_parcelas: data.parcelas,
      
      // Campos de compatibilidade
      category: normalizedType === 'auto' ? 'Veicular' : 
               normalizedType === 'vida' ? 'Pessoal' : 
               normalizedType === 'saude' ? 'Saúde' : 
               normalizedType === 'empresarial' ? 'Empresarial' : 'Geral',
      coverage: coberturas.map(c => c.descricao),
      totalCoverage: data.premio,
      limits: 'Conforme apólice'
    };

    console.log('✅ Conversão N8N concluída:', {
      id: convertedPolicy.id,
      name: convertedPolicy.name,
      status: convertedPolicy.status,
      coberturas: convertedPolicy.coberturas?.length || 0
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
