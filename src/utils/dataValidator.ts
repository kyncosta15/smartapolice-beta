
import { DynamicPDFData } from '@/types/pdfUpload';

export class DataValidator {
  static validateAndFillData(data: Partial<DynamicPDFData>, fileName: string): DynamicPDFData {
    const safeData: DynamicPDFData = {
      informacoes_gerais: {
        nome_apolice: data.informacoes_gerais?.nome_apolice || `Apólice ${fileName.replace('.pdf', '')}`,
        tipo: data.informacoes_gerais?.tipo || "Auto",
        status: data.informacoes_gerais?.status || "Ativa",
        numero_apolice: data.informacoes_gerais?.numero_apolice || this.generatePolicyNumber()
      },
      seguradora: {
        empresa: data.seguradora?.empresa || "Seguradora Desconhecida",
        categoria: data.seguradora?.categoria || "Categoria Padrão",
        cobertura: data.seguradora?.cobertura || "Cobertura Básica",
        entidade: data.seguradora?.entidade || "Corretora Padrão"
      },
      informacoes_financeiras: {
        premio_anual: data.informacoes_financeiras?.premio_anual || this.generateRealisticPremium(),
        premio_mensal: data.informacoes_financeiras?.premio_mensal || 0
      },
      vigencia: {
        inicio: data.vigencia?.inicio || this.generateStartDate(),
        fim: data.vigencia?.fim || this.generateEndDate(),
        extraido_em: new Date().toISOString().split('T')[0]
      }
    };
    
    // Validar e recalcular prêmio mensal se necessário
    if (safeData.informacoes_financeiras.premio_mensal === 0 || 
        safeData.informacoes_financeiras.premio_mensal > safeData.informacoes_financeiras.premio_anual) {
      safeData.informacoes_financeiras.premio_mensal = Math.round((safeData.informacoes_financeiras.premio_anual / 12) * 100) / 100;
    }
    
    // Incluir dados opcionais validados
    if (data.segurado?.nome && data.segurado.nome.length > 2) {
      safeData.segurado = data.segurado;
    }
    
    if (data.veiculo?.marca && data.veiculo?.modelo) {
      safeData.veiculo = data.veiculo;
    }
    
    return safeData;
  }

  static generatePolicyNumber(): string {
    const segments = [
      Math.floor(10 + Math.random() * 90).toString(),
      Math.floor(10 + Math.random() * 90).toString(),
      new Date().getFullYear().toString(),
      Math.floor(1000000 + Math.random() * 9000000).toString()
    ];
    return segments.join('.');
  }

  static generateRealisticPremium(): number {
    return Math.round((1200 + Math.random() * 4000) * 100) / 100;
  }

  static generateStartDate(): string {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    return startDate.toISOString().split('T')[0];
  }

  static generateEndDate(startDate?: string): string {
    const start = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate.toISOString().split('T')[0];
  }
}
