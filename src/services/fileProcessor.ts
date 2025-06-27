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

  // New method for batch processing with multipart/form-data indexed keys
  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`📤 Iniciando processamento em lote de ${files.length} arquivos`);
    
    // Initialize status for all files
    files.forEach(file => {
      this.updateFileStatus(file.name, {
        progress: 0,
        status: 'uploading',
        message: 'Preparando para envio em lote...'
      });
    });

    try {
      // Update status to show batch processing
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 30,
          status: 'processing',
          message: 'Enviando em lote para processamento...'
        });
      });

      // Send all files with indexed keys (arquivo0, arquivo1, etc.)
      const batchResults = await DynamicPDFExtractor.extractFromMultiplePDFs(files);
      
      // Update progress for all files
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 70,
          status: 'processing',
          message: 'Processando resposta do lote...'
        });
      });

      const resultados: ParsedPolicyData[] = [];

      // Process each result
      for (let i = 0; i < batchResults.length && i < files.length; i++) {
        const file = files[i];
        const dynamicData = batchResults[i];
        
        try {
          // Convert to parsed policy
          const parsedPolicy = DynamicPolicyParser.convertToParsedPolicy(dynamicData, file.name, file);
          resultados.push(parsedPolicy);
          
          // Update success status
          this.updateFileStatus(file.name, {
            progress: 100,
            status: 'completed',
            message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
          });

          // Add to dashboard
          this.onPolicyExtracted(parsedPolicy);
          
        } catch (error) {
          console.error(`❌ Erro ao processar dados do arquivo ${file.name}:`, error);
          
          this.updateFileStatus(file.name, {
            progress: 100,
            status: 'failed',
            message: `❌ ${error instanceof Error ? error.message : 'Erro no processamento'}`
          });
        }
      }

      console.log(`🎉 Processamento em lote completo! ${resultados.length}/${files.length} arquivos processados com sucesso`);
      
      // Show batch completion notification
      if (resultados.length > 0) {
        this.toast({
          title: `🎉 Lote Processado com Sucesso`,
          description: `${resultados.length} de ${files.length} arquivos processados usando chaves indexadas`,
        });
      }

      // Clean up status after 3 seconds
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 3000);

      return resultados;

    } catch (error) {
      console.error('❌ Erro no processamento do lote:', error);
      
      // Update all files with error status
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro no lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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
