
import { DynamicPDFData } from '@/types/pdfUpload';
import { InsurerDetector } from '@/utils/insurerDetector';
import { DataExtractor } from '@/utils/dataExtractor';
import { DataValidator } from '@/utils/dataValidator';
import { PDFTextSimulator } from '@/utils/pdfTextSimulator';

export class DynamicPDFExtractor {
  static async extractFromPDF(file: File): Promise<DynamicPDFData> {
    console.log(`🔍 Iniciando extração dinâmica otimizada: ${file.name}`);
    
    // Simular tempo de processamento OCR realista
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    // 1. Extrair texto do PDF (simulado)
    console.log('📄 Extraindo texto do PDF...');
    const extractedText = await PDFTextSimulator.simulateTextExtraction(file);
    
    // 2. Detectar seguradora com algoritmo otimizado
    console.log('🏢 Detectando seguradora...');
    const detectedInsurer = InsurerDetector.detectInsuranceCompany(extractedText);
    const insurerConfig = InsurerDetector.getInsurerConfig(detectedInsurer);
    
    // 3. Extrair dados específicos com múltiplos padrões
    console.log('🔧 Extraindo dados específicos...');
    const extractedData = DataExtractor.extractSpecificData(extractedText, insurerConfig, detectedInsurer);
    
    // 4. Validar e normalizar dados
    console.log('✅ Validando dados extraídos...');
    const validatedData = DataValidator.validateAndFillData(extractedData, file.name);
    
    console.log(`🎉 Extração concluída para ${detectedInsurer}:`, {
      apolice: validatedData.informacoes_gerais.numero_apolice,
      premio_anual: validatedData.informacoes_financeiras.premio_anual,
      premio_mensal: validatedData.informacoes_financeiras.premio_mensal,
      vigencia: `${validatedData.vigencia.inicio} até ${validatedData.vigencia.fim}`
    });
    
    return validatedData;
  }
}
