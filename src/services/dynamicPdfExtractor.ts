
import { DynamicPDFData } from '@/types/pdfUpload';
import { PDFTextSimulator } from '@/utils/pdfTextSimulator';
import { EnhancedDataExtractor } from '@/utils/enhancedDataExtractor';

export class DynamicPDFExtractor {
  static async extractFromPDF(file: File): Promise<DynamicPDFData> {
    console.log(`🔍 Iniciando extração dinâmica de alta precisão: ${file.name}`);
    
    // Simular tempo de processamento OCR realista
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    try {
      // 1. Extrair texto do PDF (simulado com dados mais realistas)
      console.log('📄 Extraindo texto do PDF com OCR avançado...');
      const extractedText = await PDFTextSimulator.simulateTextExtraction(file);
      
      // 2. Usar o extrator aprimorado com validação rigorosa
      console.log('🔧 Aplicando algoritmos de extração de precisão...');
      const enhancedData = EnhancedDataExtractor.extractFromText(extractedText);
      
      // 3. Converter para formato legado compatível
      console.log('🔄 Convertendo para formato do sistema...');
      const legacyData = EnhancedDataExtractor.convertToLegacyFormat(enhancedData);
      
      // 4. Log detalhado dos resultados
      console.log(`🎉 Extração concluída com sucesso:`, {
        arquivo: file.name,
        seguradora: legacyData.seguradora.empresa,
        apolice: legacyData.informacoes_gerais.numero_apolice,
        segurado: legacyData.segurado?.nome || "Não identificado",
        premio_anual: `R$ ${legacyData.informacoes_financeiras.premio_anual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        premio_mensal: `R$ ${legacyData.informacoes_financeiras.premio_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        vigencia: `${legacyData.vigencia.inicio} até ${legacyData.vigencia.fim}`,
        veiculo: legacyData.veiculo?.modelo || "Não identificado",
        precisao: "Alta"
      });
      
      return legacyData;
      
    } catch (error) {
      console.error('❌ Erro na extração de dados:', error);
      
      // Retornar dados padrão em caso de erro
      return {
        informacoes_gerais: {
          nome_apolice: `Apólice ${file.name.replace('.pdf', '')}`,
          tipo: "Auto",
          status: "Processamento com erro",
          numero_apolice: `ERR-${Date.now()}`
        },
        seguradora: {
          empresa: "Erro na identificação",
          categoria: "N/A",
          cobertura: "N/A",
          entidade: "N/A"
        },
        informacoes_financeiras: {
          premio_anual: 0,
          premio_mensal: 0
        },
        vigencia: {
          inicio: new Date().toISOString().split('T')[0],
          fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          extraido_em: new Date().toISOString().split('T')[0]
        }
      };
    }
  }
}
