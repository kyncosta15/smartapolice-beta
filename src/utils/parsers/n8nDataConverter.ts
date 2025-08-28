
import { ParsedPolicyData } from '../policyDataParser';

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
  corretora?: string;
  cidade?: string;
  uf?: string;
  coberturas?: Array<{
    descricao: string;
    lmi?: number;
  }>;
}

export class N8NDataConverter {
  
  // Mapear status do N8N para valores do sistema
  private static mapStatus(n8nStatus: string): string {
    const statusMap: Record<string, string> = {
      'Ativa': 'vigente',
      'Vigente': 'vigente',
      'Vencida': 'vencida',
      'Cancelada': 'nao_renovada',
      'Pendente': 'pendente_analise',
      'Em Análise': 'pendente_analise'
    };
    
    return statusMap[n8nStatus] || 'vigente';
  }

  // Normalizar tipo de seguro
  private static normalizeInsuranceType(tipo: string): string {
    const typeMap: Record<string, string> = {
      'Automóvel': 'auto',
      'Auto': 'auto',
      'Veicular': 'auto',
      'Vida': 'vida',
      'Saúde': 'saude',
      'Residencial': 'residencial',
      'Empresarial': 'empresarial'
    };
    
    return typeMap[tipo] || 'auto';
  }

  // Gerar parcelas baseado nos dados do N8N
  private static generateInstallments(numberOfInstallments: number, installmentValue: number, startDate: string) {
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

  // FUNÇÃO PRINCIPAL: Converter dados do N8N para ParsedPolicyData
  static convertN8NDirectData(
    data: N8NDirectData,
    fileName: string,
    file?: File,
    userIdOverride?: string
  ): ParsedPolicyData {
    console.log('🔄 Convertendo dados N8N ORIGINAIS:', data);

    // Garantir userId válido
    const userId = userIdOverride || data.user_id || crypto.randomUUID();
    const policyId = `n8n-${data.numero_apolice}-${Date.now()}`;

    // Mapear status e tipo
    const mappedStatus = this.mapStatus(data.status);
    const normalizedType = this.normalizeInsuranceType(data.tipo);
    
    // PRESERVAR dados originais do N8N - cálculo fiel aos dados recebidos
    const monthlyAmount = data.custo_mensal || (data.valor_parcela > 0 ? data.valor_parcela : data.premio / 12);
    
    // Processar coberturas mantendo estrutura original
    const coberturas = Array.isArray(data.coberturas) ? data.coberturas.map(cobertura => ({
      id: crypto.randomUUID(),
      descricao: cobertura.descricao,
      lmi: cobertura.lmi
    })) : [];

    // Gerar parcelas baseado nos dados reais do N8N
    const installments = data.parcelas > 0 ? 
      this.generateInstallments(data.parcelas, data.valor_parcela || monthlyAmount, data.inicio) :
      this.generateInstallments(1, data.premio, data.inicio); // Pagamento à vista se parcelas = 0

    const convertedPolicy: ParsedPolicyData = {
      id: policyId,
      name: `Apólice ${data.segurado}`,
      type: normalizedType,
      insurer: data.seguradora,
      premium: data.premio,
      monthlyAmount: monthlyAmount,
      startDate: data.inicio,
      endDate: data.fim,
      policyNumber: data.numero_apolice,
      paymentFrequency: data.pagamento,
      status: mappedStatus,
      file: file,
      extractedAt: new Date().toISOString(),
      
      // Campos obrigatórios
      expirationDate: data.fim,
      policyStatus: mappedStatus as any,
      
      // Dados específicos do N8N
      insuredName: data.segurado,
      documento: data.documento,
      documento_tipo: data.documento_tipo,
      vehicleModel: data.modelo_veiculo,
      uf: data.uf,
      deductible: data.franquia,
      
      // Parcelas e coberturas ORIGINAIS
      installments: installments,
      coberturas: coberturas,
      quantidade_parcelas: data.parcelas || 1,
      
      // Campos de compatibilidade para o sistema
      category: normalizedType === 'auto' ? 'Veicular' : 
               normalizedType === 'vida' ? 'Pessoal' : 
               normalizedType === 'saude' ? 'Saúde' : 'Geral',
      coverage: coberturas.map(c => c.descricao),
      totalCoverage: data.premio,
      entity: data.corretora || 'Não informado',
      pdfPath: undefined,
      
      // Detalhes do veículo se disponível
      vehicleDetails: data.modelo_veiculo ? {
        model: data.modelo_veiculo,
        year: data.ano_modelo ? parseInt(data.ano_modelo) : undefined,
        plate: data.placa
      } : undefined
    };

    console.log('✅ Dados N8N convertidos:', {
      id: convertedPolicy.id,
      name: convertedPolicy.name,
      status: convertedPolicy.status,
      coberturas: convertedPolicy.coberturas?.length || 0,
      monthlyAmount: convertedPolicy.monthlyAmount,
      installments: convertedPolicy.installments?.length || 0
    });

    return convertedPolicy;
  }

  // Converter múltiplas apólices do N8N
  static convertMultipleN8NData(
    dataArray: N8NDirectData[],
    userIdOverride?: string
  ): ParsedPolicyData[] {
    console.log(`🔄 Convertendo ${dataArray.length} apólices do N8N`);
    
    return dataArray.map((data, index) => {
      try {
        return this.convertN8NDirectData(
          data,
          `n8n-policy-${index}`,
          undefined,
          userIdOverride
        );
      } catch (error) {
        console.error(`❌ Erro ao converter apólice ${index}:`, error);
        throw error;
      }
    });
  }
}
