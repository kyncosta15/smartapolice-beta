import { ParsedPolicyData } from '@/utils/policyDataParser';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { BatchFileProcessor } from './processors/batchFileProcessor';
import { SingleFileProcessor } from './processors/singleFileProcessor';

export class FileProcessor {
  private batchProcessor: BatchFileProcessor;
  private singleProcessor: SingleFileProcessor;
  private userId: string | null;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    userId: string | null, // Corrigido: agora recebe userId como parâmetro
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.userId = userId;
    
    this.batchProcessor = new BatchFileProcessor(
      updateFileStatus,
      removeFileStatus,
      onPolicyExtracted,
      toast
    );

    this.singleProcessor = new SingleFileProcessor(
      updateFileStatus,
      removeFileStatus
    );
  }

  // Método para processar múltiplos arquivos sequencialmente
  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`📤 FileProcessor: Passando userId ${this.userId} para BatchFileProcessor`);
    return this.batchProcessor.processMultipleFiles(files, this.userId);
  }

  // Keep existing single file processing method
  async processFile(file: File): Promise<void> {
    try {
      console.log(`📤 FileProcessor: Passando userId ${this.userId} para SingleFileProcessor`);
      await this.singleProcessor.processFile(file, this.userId);
    } catch (error) {
      // Erro já tratado no SingleFileProcessor
    }
  }
}
