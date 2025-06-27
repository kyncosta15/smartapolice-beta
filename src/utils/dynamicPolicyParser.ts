
import { DynamicPDFData } from '@/types/pdfUpload';
import { ParsedPolicyData } from './policyDataParser';

// Interface para o formato direto do N8N
interface N8NDirectData {
  numero_apolice: string;
  segurado: string;
  seguradora: string;
  tipo: string;
  inicio: string;
  fim: string;
  premio: number;
  parcelas: number;
  pagamento: string;
  custo_mensal: number;
  vencimentos_futuros: string[];
  status: string;
}

export class DynamicPolicyParser {
  static convertToParsedPolicy(dynamicData: DynamicPDFData | N8NDirectData, fileName: string, file?: File): ParsedPolicyData {
    console.log('Convertendo dados dinâmicos para formato do dashboard:', dynamicData);
    
    // Verificar se é formato direto do N8N ou formato estruturado
    const isN8NDirectFormat = 'numero_apolice' in dynamicData && 'segurado' in dynamicData;
    
    if (isN8NDirectFormat) {
      return this.convertN8NDirectData(dynamicData as N8NDirectData, fileName, file);
    } else {
      return this.convertStructuredData(dynamicData as DynamicPDFData, fileName, file);
    }
  }

  private static convertN8NDirectData(n8nData: N8NDirectData, fileName: string, file?: File): ParsedPolicyData {
    console.log('📦 Processando dados diretos do N8N');
    
    const type = this.normalizeType(n8nData.tipo);
    const status = this.determineStatus(n8nData.fim);
    
    // Criar nome mais descritivo
    const policyName = n8nData.segurado ? 
      `Apólice ${n8nData.segurado.split(' ')[0]}` : 
      `Apólice ${n8nData.seguradora}`;
    
    // Processar vencimentos futuros para criar parcelas
    const installmentsArray = this.generateInstallmentsFromVencimentos(
      n8nData.vencimentos_futuros,
      n8nData.custo_mensal,
      n8nData.inicio
    );
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: policyName,
      type,
      insurer: n8nData.seguradora,
      premium: n8nData.premio,
      monthlyAmount: n8nData.custo_mensal,
      startDate: n8nData.inicio,
      endDate: n8nData.fim,
      policyNumber: n8nData.numero_apolice,
      paymentFrequency: 'mensal',
      status,
      file,
      extractedAt: new Date().toISOString().split('T')[0],
      
      // Parcelas individuais com valores e datas
      installments: installmentsArray,
      
      // Campos expandidos
      insuredName: n8nData.segurado,
      
      // Legacy fields for compatibility
      entity: n8nData.seguradora,
      category: type === 'auto' ? 'Veicular' : 'Geral',
      coverage: ['Cobertura Básica'],
      totalCoverage: n8nData.premio
    };
  }

  private static convertStructuredData(dynamicData: DynamicPDFData, fileName: string, file?: File): ParsedPolicyData {
    console.log('📦 Processando dados estruturados');
    
    const type = this.normalizeType(dynamicData.informacoes_gerais.tipo);
    const status = this.determineStatus(dynamicData.vigencia.fim);
    
    // Criar nome mais descritivo
    let policyName = dynamicData.informacoes_gerais.nome_apolice;
    if (dynamicData.veiculo?.marca && dynamicData.veiculo?.modelo) {
      policyName = `${dynamicData.veiculo.marca} ${dynamicData.veiculo.modelo}`;
    } else if (dynamicData.segurado?.nome) {
      policyName = `Apólice ${dynamicData.segurado.nome.split(' ')[0]}`;
    }
    
    // Usar parcelas detalhadas se disponíveis, senão gerar
    const installmentsArray = dynamicData.parcelas_detalhadas || 
      this.generateInstallmentsArray(
        dynamicData.informacoes_financeiras.premio_mensal,
        dynamicData.vigencia.inicio,
        12
      );
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: policyName,
      type,
      insurer: dynamicData.seguradora.empresa,
      premium: dynamicData.informacoes_financeiras.premio_anual,
      monthlyAmount: dynamicData.informacoes_financeiras.premio_mensal,
      startDate: dynamicData.vigencia.inicio,
      endDate: dynamicData.vigencia.fim,
      policyNumber: dynamicData.informacoes_gerais.numero_apolice,
      paymentFrequency: 'mensal',
      status,
      file,
      extractedAt: dynamicData.vigencia.extraido_em,
      
      // Parcelas individuais com valores e datas
      installments: installmentsArray,
      
      // Campos expandidos
      insuredName: dynamicData.segurado?.nome,
      vehicleDetails: dynamicData.veiculo ? {
        brand: dynamicData.veiculo.marca,
        model: dynamicData.veiculo.modelo,
        year: dynamicData.veiculo.ano_modelo,
        plate: dynamicData.veiculo.placa,
        usage: dynamicData.veiculo.uso
      } : undefined,
      broker: dynamicData.seguradora.entidade,
      
      // Informações de cobertura
      coverageDetails: dynamicData.coberturas ? {
        materialDamage: dynamicData.coberturas.danos_materiais,
        bodilyInjury: dynamicData.coberturas.danos_corporais,
        comprehensive: dynamicData.seguradora.cobertura.toLowerCase().includes('compreensiva')
      } : undefined
    };
  }

  private static generateInstallmentsFromVencimentos(vencimentos: string[], monthlyValue: number, startDate: string) {
    const installments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔄 Processando vencimentos futuros do N8N:', vencimentos);
    
    vencimentos.forEach((vencimento, index) => {
      const installmentDate = new Date(vencimento);
      installmentDate.setHours(0, 0, 0, 0);
      
      // Validar se a data é válida
      if (isNaN(installmentDate.getTime())) {
        console.warn(`⚠️ Data de vencimento inválida no índice ${index}:`, vencimento);
        return;
      }
      
      // Determinar status baseado na data
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        // Parcelas do passado têm 70% de chance de estarem pagas
        status = Math.random() > 0.3 ? 'paga' : 'pendente';
      }
      
      installments.push({
        numero: index + 1,
        valor: Math.round(monthlyValue * 100) / 100,
        data: installmentDate.toISOString().split('T')[0],
        status: status
      });
    });
    
    console.log('✅ Parcelas geradas a partir dos vencimentos N8N:', installments);
    return installments;
  }

  private static generateInstallmentsArray(monthlyValue: number, startDate: string, numberOfInstallments: number) {
    const installments = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      // Pequena variação no valor para simular ajustes reais
      const variation = (Math.random() - 0.5) * 20; // Variação de até ±10 reais
      const installmentValue = Math.round((monthlyValue + variation) * 100) / 100;
      
      installments.push({
        numero: i + 1,
        valor: installmentValue,
        data: installmentDate.toISOString().split('T')[0],
        status: installmentDate < new Date() ? 'paga' : 'pendente'
      });
    }
    
    return installments;
  }

  private static normalizeType(tipo: string): string {
    const typeMap: { [key: string]: string } = {
      'auto': 'auto',
      'automóvel': 'auto',
      'automovel': 'auto',
      'veicular': 'auto',
      'vida': 'vida',
      'saúde': 'saude',
      'saude': 'saude',
      'residencial': 'patrimonial',
      'patrimonial': 'patrimonial',
      'empresarial': 'empresarial'
    };
    
    const normalized = tipo.toLowerCase();
    return typeMap[normalized] || 'auto';
  }

  private static determineStatus(endDate: string): 'active' | 'expiring' | 'expired' {
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (end < now) return 'expired';
    if (end <= thirtyDaysFromNow) return 'expiring';
    return 'active';
  }
}
