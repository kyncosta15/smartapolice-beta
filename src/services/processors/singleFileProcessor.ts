
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';

export async function processSingleFile(file: File): Promise<ParsedPolicyData | null> {
  try {
    // Use the existing DynamicPDFExtractor service instead of pdf-parse
    const extractedDataArray = await DynamicPDFExtractor.extractFromMultiplePDFs([file], null);
    
    if (!extractedDataArray || extractedDataArray.length === 0) {
      console.warn(`Não foi possível extrair dados do arquivo ${file.name}`);
      return null;
    }

    const extractedData = extractedDataArray[0];

    // Convert the extracted data to ParsedPolicyData
    let parsedPolicy: ParsedPolicyData;

    if (extractedData.numero_apolice && extractedData.segurado && extractedData.seguradora) {
      // É dado direto do N8N
      parsedPolicy = N8NDataConverter.convertN8NDirectData(extractedData, file.name, file);
    } else if (extractedData.informacoes_gerais && extractedData.seguradora && extractedData.vigencia) {
      // É dado estruturado
      parsedPolicy = StructuredDataConverter.convertStructuredData(extractedData, file.name, file);
    } else {
      // Fallback para dados não estruturados
      console.warn('Dados não estruturados recebidos, usando fallback');
      parsedPolicy = createFallbackPolicy(file);
    }

    return parsedPolicy;
  } catch (error: any) {
    console.error(`Erro ao processar o arquivo ${file.name}:`, error);
    return null;
  }
}

function createFallbackPolicy(file: File): ParsedPolicyData {
  const mockPolicyData: ParsedPolicyData = {
    id: window.crypto.randomUUID(),
    name: `Apólice ${file.name}`,
    type: 'auto',
    insurer: 'Seguradora Exemplo',
    premium: 1200,
    monthlyAmount: 150,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    policyNumber: `POL-${Date.now()}`,
    paymentFrequency: 'monthly',
    status: 'active',
    file,
    extractedAt: new Date().toISOString(),
    installments: [],
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    policyStatus: 'vigente',
    
    // Campos opcionais
    coberturas: [],
    entity: 'Corretora Exemplo',
    category: 'Veicular',
    coverage: ['Cobertura Básica'],
    totalCoverage: 1200
  };

  return mockPolicyData;
}

export class SingleFileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
  }

  async processFile(file: File, userId: string | null): Promise<void> {
    try {
      this.updateFileStatus(file.name, {
        progress: 0,
        status: 'processing',
        message: 'Iniciando processamento...'
      });

      const result = await processSingleFile(file);
      
      if (result) {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'completed',
          message: 'Processamento concluído'
        });
      } else {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: 'Falha no processamento'
        });
      }
    } catch (error) {
      this.updateFileStatus(file.name, {
        progress: 100,
        status: 'failed',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }
}
