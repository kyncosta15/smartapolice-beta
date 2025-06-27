
import { DynamicPDFData } from '@/types/pdfUpload';
import { InsurerDetector } from '@/utils/insurerDetector';
import { DataExtractor } from '@/utils/dataExtractor';
import { DataValidator } from '@/utils/dataValidator';
import { PDFTextSimulator } from '@/utils/pdfTextSimulator';

export class DynamicPDFExtractor {
  static async extractFromPDF(file: File): Promise<DynamicPDFData> {
    console.log(`🔍 Extraindo dados dinâmicos do PDF: ${file.name}`);
    
    // Simular tempo de processamento OCR
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simular extração de texto do PDF
    const extractedText = await PDFTextSimulator.simulateTextExtraction(file);
    
    // Identificar seguradora usando nova lógica de detecção
    const detectedInsurer = InsurerDetector.detectInsuranceCompany(extractedText);
    const insurerConfig = InsurerDetector.getInsurerConfig(detectedInsurer);
    
    // Extrair dados específicos com regex melhorados
    const extractedData = DataExtractor.extractSpecificData(extractedText, insurerConfig, detectedInsurer);
    
    // Validar e preencher dados ausentes
    const validatedData = DataValidator.validateAndFillData(extractedData, file.name);
    
    console.log(`✅ Dados dinâmicos extraídos:`, validatedData);
    return validatedData;
  }
}
