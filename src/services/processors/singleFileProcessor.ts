
import { readFileSync } from 'fs';
import { join } from 'path';
import * as pdf from 'pdf-parse';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractStructuredData } from '@/utils/extractStructuredData';
import { FileProcessingStatus } from '@/types/pdfUpload';

export async function processSingleFile(file: File): Promise<ParsedPolicyData | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);

    if (!data?.text) {
      console.warn(`Não foi possível extrair texto do arquivo ${file.name}`);
      return null;
    }

    const structuredData = extractStructuredData(data.text);

    if (!structuredData) {
      console.warn(`Não foi possível extrair dados estruturados do arquivo ${file.name}`);
      return null;
    }

    const mockPolicyData: ParsedPolicyData = {
      id: crypto.randomUUID(),
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
  } catch (error: any) {
    console.error(`Erro ao processar o arquivo ${file.name}:`, error);
    return null;
  }
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
