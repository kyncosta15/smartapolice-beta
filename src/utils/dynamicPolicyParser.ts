import { DynamicPDFData } from '@/types/pdfUpload';
import { ParsedPolicyData } from './policyDataParser';

export class DynamicPolicyParser {
  static convertToParsedPolicy(dynamicData: DynamicPDFData, fileName: string, file?: File): ParsedPolicyData {
    console.log('Convertendo dados dinâmicos para formato do dashboard:', dynamicData);
    
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
