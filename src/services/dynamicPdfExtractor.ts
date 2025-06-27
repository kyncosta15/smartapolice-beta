
import { DynamicPDFData } from '@/types/pdfUpload';
import { PDFTextSimulator } from '@/utils/pdfTextSimulator';
import { EnhancedDataExtractor } from '@/utils/enhancedDataExtractor';

export class DynamicPDFExtractor {
  static async extractFromPDF(file: File): Promise<DynamicPDFData> {
    console.log(`🔍 Iniciando extração dinâmica otimizada: ${file.name}`);
    
    // Simular tempo de processamento OCR realista
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    // 1. Extrair texto do PDF (simulado)
    console.log('📄 Extraindo texto do PDF...');
    const extractedText = await PDFTextSimulator.simulateTextExtraction(file);
    
    // 2. Usar o novo extrator aprimorado
    console.log('🔧 Extraindo dados com padrões otimizados...');
    const enhancedData = EnhancedDataExtractor.extractFromText(extractedText);
    
    // 3. Converter para formato legado
    console.log('🔄 Convertendo para formato compatível...');
    const legacyData = EnhancedDataExtractor.convertToLegacyFormat(enhancedData);
    
    console.log(`🎉 Extração concluída:`, {
      seguradora: legacyData.seguradora.empresa,
      apolice: legacyData.informacoes_gerais.numero_apolice,
      premio_anual: legacyData.informacoes_financeiras.premio_anual,
      premio_mensal: legacyData.informacoes_financeiras.premio_mensal,
      vigencia: `${legacyData.vigencia.inicio} até ${legacyData.vigencia.fim}`,
      segurado: legacyData.segurado?.nome || "Não identificado"
    });
    
    return legacyData;
  }
}
