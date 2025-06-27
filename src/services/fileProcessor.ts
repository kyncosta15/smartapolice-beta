import { ParsedPolicyData } from '@/utils/policyDataParser';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { BatchFileProcessor } from './processors/batchFileProcessor';
import { SingleFileProcessor } from './processors/singleFileProcessor';

export class FileProcessor {
  private batchProcessor: BatchFileProcessor;
  private singleProcessor: SingleFileProcessor;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    fetchPolicyData: any, // Não usado mais, mantido para compatibilidade
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
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
    return this.batchProcessor.processMultipleFiles(files);
  }

  // Keep existing single file processing method
  async processFile(file: File): Promise<void> {
    try {
      await this.singleProcessor.processFile(file);
    } catch (error) {
      // Erro já tratado no SingleFileProcessor
    }
  }
}
