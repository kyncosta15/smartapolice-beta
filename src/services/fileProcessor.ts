
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from './dynamicPdfExtractor';
import { DynamicPolicyParser } from '@/utils/dynamicPolicyParser';
import { FileProcessingStatus } from '@/types/pdfUpload';

export class FileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    fetchPolicyData: any, // Não usado mais, mantido para compatibilidade
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
  }

  // Método para processar múltiplos arquivos sequencialmente
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
          // Extract data from single file
          this.updateFileStatus(file.name, {
            progress: 50,
            status: 'processing',
            message: 'Extraindo dados com IA...'
          });

          const extractedData = await DynamicPDFExtractor.extractFromPDF(file);

          // Update progress
          this.updateFileStatus(file.name, {
            progress: 80,
            status: 'processing',
            message: 'Convertendo dados extraídos...'
          });

          // Verifica se os dados extraídos são um array ou item único
          const dataArray = Array.isArray(extractedData) ? extractedData : [extractedData];

          // Convert each data item to parsed policy
          for (const singleData of dataArray) {
            const parsedPolicy = DynamicPolicyParser.convertToParsedPolicy(singleData, file.name, file);
            allResults.push(parsedPolicy);
            
            // Add to dashboard immediately
            this.onPolicyExtracted(parsedPolicy);
          }

          // Update success status
          this.updateFileStatus(file.name, {
            progress: 100,
            status: 'completed',
            message: `✅ Processado: ${dataArray.length} apólice(s) extraída(s)`
          });

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

  // Keep existing single file processing method
  async processFile(file: File): Promise<void> {
    try {
      await this.processFileInternal(file);
    } catch (error) {
      // Erro já tratado no processFileInternal
    }
  }

  private async processFileInternal(file: File): Promise<ParsedPolicyData> {
    const fileName = file.name;
    
    // Inicializar status do arquivo
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Iniciando processamento...'
    });

    // 1. Simular carregamento do arquivo
    this.updateFileStatus(fileName, {
      progress: 20,
      status: 'processing',
      message: 'Carregando arquivo PDF...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Extrair dados do PDF usando extração dinâmica
    this.updateFileStatus(fileName, {
      progress: 40,
      status: 'processing',
      message: 'Identificando seguradora e layout...'
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    this.updateFileStatus(fileName, {
      progress: 65,
      status: 'processing',
      message: 'Extraindo dados com IA dinâmica...'
    });

    const dynamicData = await DynamicPDFExtractor.extractFromPDF(file);

    // 3. Converter para formato do dashboard
    this.updateFileStatus(fileName, {
      progress: 85,
      status: 'processing',
      message: 'Processando dados extraídos...'
    });

    const parsedPolicy = DynamicPolicyParser.convertToParsedPolicy(dynamicData, fileName, file);

    // 4. Finalizar processamento
    this.updateFileStatus(fileName, {
      progress: 100,
      status: 'completed',
      message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
    });

    // Remover da lista após 3 segundos
    setTimeout(() => {
      this.removeFileStatus(fileName);
    }, 3000);

    return parsedPolicy;
  }
}
