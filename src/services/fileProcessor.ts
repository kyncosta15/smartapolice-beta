
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { BatchFileProcessor } from './processors/batchFileProcessor';
import { SingleFileProcessor } from './processors/singleFileProcessor';

export class FileProcessor {
  private batchProcessor: BatchFileProcessor;
  private singleProcessor: SingleFileProcessor;
  private userId: string | null;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    userId: string | null,
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.userId = userId;
    this.onPolicyExtracted = onPolicyExtracted;
    
    this.batchProcessor = new BatchFileProcessor(
      updateFileStatus,
      removeFileStatus,
      onPolicyExtracted // Passar callback para o batch processor
    );

    this.singleProcessor = new SingleFileProcessor(
      updateFileStatus,
      removeFileStatus,
      onPolicyExtracted // Passar callback para o single processor
    );
  }

  // Método para processar múltiplos arquivos sequencialmente
  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`🚀 FileProcessor.processMultipleFiles CHAMADO!`);
    console.log(`📤 FileProcessor: Passando userId ${this.userId} para BatchFileProcessor`);
    const result = await this.batchProcessor.processBatch(files, this.userId);
    console.log(`✅ FileProcessor: Resultado do BatchFileProcessor:`, result.length);
    return result;
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
