
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyDataParser } from '@/utils/policyDataParser';
import { PDFExtractor } from './pdfExtractor';
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

  async processFile(file: File): Promise<void> {
    const fileName = file.name;
    
    // Inicializar status do arquivo
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Iniciando processamento...'
    });

    try {
      // 1. Simular carregamento do arquivo
      this.updateFileStatus(fileName, {
        progress: 25,
        status: 'processing',
        message: 'Carregando arquivo PDF...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Extrair dados do PDF usando IA local
      this.updateFileStatus(fileName, {
        progress: 50,
        status: 'processing',
        message: 'Extraindo dados com IA...'
      });

      const extractedData = await PDFExtractor.extractFromPDF(file);

      // 3. Processar e converter dados
      this.updateFileStatus(fileName, {
        progress: 75,
        status: 'processing',
        message: 'Processando dados extraídos...'
      });

      const parsedPolicy = PolicyDataParser.convertToParsedPolicy(extractedData, fileName, file);

      // 4. Finalizar processamento
      this.updateFileStatus(fileName, {
        progress: 100,
        status: 'completed',
        message: `✅ Processado: ${parsedPolicy.insurer} - ${parsedPolicy.type}`
      });

      this.onPolicyExtracted(parsedPolicy);

      this.toast({
        title: "🎉 Apólice Extraída",
        description: `${parsedPolicy.name} processada com sucesso`,
      });

      // Remover da lista após 3 segundos
      setTimeout(() => {
        this.removeFileStatus(fileName);
      }, 3000);

    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      
      this.updateFileStatus(fileName, {
        progress: 100,
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Erro no processamento'}`
      });

      this.toast({
        title: "Erro no Processamento",
        description: `Falha ao processar ${fileName}`,
        variant: "destructive",
      });

      // Remover após 5 segundos em caso de erro
      setTimeout(() => {
        this.removeFileStatus(fileName);
      }, 5000);
    }
  }
}
