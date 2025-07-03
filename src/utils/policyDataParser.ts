
import { DynamicPDFData } from '@/types/pdfUpload';

export interface InstallmentData {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
}

export interface ParsedPolicyData {
  id: string;
  name: string;
  type: string;
  insurer: string;
  premium: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  policyNumber: string;
  paymentFrequency: string;
  status: string;
  file?: File;
  pdfPath?: string; // Caminho do PDF no storage
  extractedAt: string;
  
  // Updated to use proper InstallmentData type
  installments: InstallmentData[] | number;
  
  // Campos expandidos opcionais
  insuredName?: string;
  
  // Novas informações de documento
  insuredDocument?: string;
  insuredPersonType?: 'PF' | 'PJ';
  insuredCpfCnpj?: string;
  
  // Campos de documento do N8N - principais campos a serem usados
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  
  vehicleDetails?: {
    brand?: string;
    model?: string;
    year?: string;
    plate?: string;
    usage?: string;
  };
  broker?: string;
  
  // Informações de cobertura
  coverageDetails?: {
    materialDamage?: number;
    bodilyInjury?: number;
    comprehensive?: boolean;
  };

  // Add missing claimRate property
  claimRate?: number;

  // Legacy fields for compatibility
  entity?: string;
  category?: string;
  coverage?: string[];
  deductible?: number;
  limits?: string;
  totalCoverage?: number;
  
  // Novos campos de análise de vencimentos
  overdueInstallments?: number;
  upcomingInstallments?: number;
  nextDueDate?: string | null;
}

export function parsePolicyData(data: DynamicPDFData, file?: File): ParsedPolicyData {
  // Usar parcelas_detalhadas se disponível, caso contrário usar vencimentos_futuros
  let installments: InstallmentData[] = [];
  
  if (data.parcelas_detalhadas && Array.isArray(data.parcelas_detalhadas) && data.parcelas_detalhadas.length > 0) {
    console.log('📦 Usando parcelas detalhadas existentes');
    installments = data.parcelas_detalhadas.map(parcela => ({
      numero: parcela.numero,
      valor: parcela.valor,
      data: parcela.data,
      status: parcela.status
    }));
  } else if (data.vencimentos_futuros && Array.isArray(data.vencimentos_futuros) && data.vencimentos_futuros.length > 0) {
    console.log('📦 Criando parcelas a partir dos vencimentos futuros');
    const monthlyAmount = data.informacoes_financeiras.premio_mensal;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    installments = data.vencimentos_futuros.map((vencimento, index) => {
      const installmentDate = new Date(vencimento);
      installmentDate.setHours(0, 0, 0, 0);
      
      // Determinar status baseado na data atual
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        // Parcelas passadas têm 70% de chance de estarem pagas
        status = Math.random() > 0.3 ? 'paga' : 'pendente';
      }
      
      return {
        numero: index + 1,
        valor: monthlyAmount,
        data: vencimento, // Usar a data exata dos vencimentos futuros
        status: status
      };
    });
  } else {
    console.log('📦 Criando parcelas padrão baseadas no prêmio mensal');
    // Criar parcelas padrão se não tiver nem parcelas detalhadas nem vencimentos futuros
    const monthlyAmount = data.informacoes_financeiras.premio_mensal;
    const startDate = new Date(data.vigencia.inicio);
    const numberOfInstallments = 12;
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      installmentDate.setHours(0, 0, 0, 0);
      
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        status = Math.random() > 0.3 ? 'paga' : 'pendente';
      }
      
      installments.push({
        numero: i + 1,
        valor: monthlyAmount,
        data: installmentDate.toISOString().split('T')[0],
        status: status
      });
    }
  }

  console.log('✅ Parcelas processadas:', installments.length, 'parcelas criadas');

  return {
    id: data.informacoes_gerais.numero_apolice || `policy-${Date.now()}`,
    name: data.informacoes_gerais.nome_apolice || 'Apólice sem nome',
    type: data.informacoes_gerais.tipo || 'Auto',
    insurer: data.seguradora.empresa || 'Seguradora não identificada',
    premium: data.informacoes_financeiras.premio_anual || 0,
    monthlyAmount: data.informacoes_financeiras.premio_mensal || 0,
    startDate: data.vigencia.inicio,
    endDate: data.vigencia.fim,
    policyNumber: data.informacoes_gerais.numero_apolice || 'Sem número',
    paymentFrequency: 'Mensal',
    status: data.informacoes_gerais.status === 'Ativa' ? 'active' : 'expired',
    file,
    extractedAt: data.vigencia.extraido_em,
    installments,
    
    // Campos opcionais incluindo novos campos de documento
    insuredName: data.segurado?.nome,
    insuredDocument: data.segurado?.documento,
    insuredPersonType: data.segurado?.tipo_pessoa,
    insuredCpfCnpj: data.segurado?.cpf_cnpj,
    broker: data.seguradora.entidade,
    
    // Campos de documento do N8N - prioritários
    documento: data.documento,
    documento_tipo: data.documento_tipo,
    
    // Legacy compatibility
    entity: data.seguradora.entidade,
    category: data.seguradora.categoria,
    coverage: [data.seguradora.cobertura],
    totalCoverage: data.informacoes_financeiras.premio_anual
  };
}
