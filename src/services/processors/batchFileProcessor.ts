
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';

export class BatchFileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
  }

  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`📤 Iniciando processamento sequencial de ${files.length} arquivos`);
    
    // Initialize status for all files
    files.forEach(file => {
      this.updateFileStatus(file.name, {
        progress: 0,
        status: 'uploading',
        message: 'Aguardando processamento sequencial...'
      });
    });

    const allResults: ParsedPolicyData[] = [];

    try {
      // Processar cada arquivo sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🔄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

        // Update status to show current processing
        this.updateFileStatus(file.name, {
          progress: 20,
          status: 'processing',
          message: `Processando arquivo ${i + 1}/${files.length}...`
        });

        try {
          const fileResults = await this.processSingleFileInBatch(file, i + 1, files.length);
          allResults.push(...fileResults);
          console.log(`✅ Arquivo ${file.name} processado com sucesso: ${fileResults.length} apólices`);
        } catch (error) {
          console.error(`❌ Erro ao processar ${file.name}:`, error);
          
          this.updateFileStatus(file.name, {
            progress: 100,
            status: 'failed',
            message: `❌ ${error instanceof Error ? error.message : 'Erro no processamento'}`
          });
        }
      }

      console.log(`🎉 Processamento sequencial completo! ${allResults.length} apólices processadas no total`);
      
      // Show completion notification
      if (allResults.length > 0) {
        this.toast({
          title: `🎉 Processamento Sequencial Concluído`,
          description: `${allResults.length} apólices foram extraídas e adicionadas ao dashboard`,
        });
      }

      // Clean up status after 3 seconds
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 3000);

      return allResults;

    } catch (error) {
      console.error('❌ Erro geral no processamento sequencial:', error);
      
      // Update all files with error status
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      });

      // Clean up after 5 seconds
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 5000);

      throw error;
    }
  }

  private async processSingleFileInBatch(file: File, currentIndex: number, totalFiles: number): Promise<ParsedPolicyData[]> {
    // Extract data from single file
    this.updateFileStatus(file.name, {
      progress: 50,
      status: 'processing',
      message: 'Extraindo dados com IA...'
    });

    const extractedDataArray = await DynamicPDFExtractor.extractFromPDF(file);
    console.log(`📦 Dados extraídos de ${file.name}:`, extractedDataArray);

    // Update progress
    this.updateFileStatus(file.name, {
      progress: 80,
      status: 'processing',
      message: 'Convertendo dados extraídos...'
    });

    // extractedDataArray já vem como array do DynamicPDFExtractor
    const results: ParsedPolicyData[] = [];

    // Convert each data item to parsed policy
    for (let j = 0; j < extractedDataArray.length; j++) {
      const singleData = extractedDataArray[j];
      console.log(`🔄 Convertendo item ${j + 1}/${extractedDataArray.length} de ${file.name}:`, singleData);
      
      const parsedPolicy = this.convertToParsedPolicy(singleData, file.name, file);
      results.push(parsedPolicy);
      
      // Add to dashboard immediately
      this.onPolicyExtracted(parsedPolicy);
      console.log(`✅ Apólice adicionada: ${parsedPolicy.name} - ${parsedPolicy.insurer}`);
    }

    // Update success status
    this.updateFileStatus(file.name, {
      progress: 100,
      status: 'completed',
      message: `✅ Processado: ${extractedDataArray.length} apólice(s) extraída(s)`
    });

    return results;
  }

  private convertToParsedPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    // Verificar se é dado direto do N8N ou estruturado
    if (data.numero_apolice && data.segurado && data.seguradora) {
      // É dado direto do N8N
      return N8NDataConverter.convertN8NDirectData(data, fileName, file);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      // É dado estruturado
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      // Fallback para dados não estruturados
      console.warn('Dados não estruturados recebidos, usando fallback');
      return this.createFallbackPolicy(data, fileName, file);
    }
  }

  private createFallbackPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fileName.replace('.pdf', ''),
      type: 'auto',
      insurer: 'Seguradora Não Identificada',
      premium: 0,
      monthlyAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: 'N/A',
      paymentFrequency: 'mensal',
      status: 'active',
      file,
      extractedAt: new Date().toISOString().split('T')[0],
      installments: []
    };
  }
}
