import { ParsedPolicyData } from '@/utils/policyDataParser';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { BatchFileProcessor, DuplicateInfo } from './processors/batchFileProcessor';
import { SingleFileProcessor } from './processors/singleFileProcessor';

export class FileProcessor {
  private batchProcessor: BatchFileProcessor;
  private singleProcessor: SingleFileProcessor;
  private userId: string | null;
  private onDuplicateDetected?: (info: DuplicateInfo) => void;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    userId: string | null, // Corrigido: agora recebe userId como parâmetro
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any,
    onDuplicateDetected?: (info: DuplicateInfo) => void
  ) {
    this.userId = userId;
    this.onDuplicateDetected = onDuplicateDetected;
    
    this.batchProcessor = new BatchFileProcessor(
      updateFileStatus,
      removeFileStatus,
      onPolicyExtracted,
      toast,
      onDuplicateDetected
    );

    this.singleProcessor = new SingleFileProcessor(
      updateFileStatus,
      removeFileStatus
    );
  }

  // Método para processar múltiplos arquivos sequencialmente
  async processMultipleFiles(files: File[], userEmail?: string | null): Promise<ParsedPolicyData[]> {
    console.log(`🚀 FileProcessor.processMultipleFiles CHAMADO!`);
    console.log(`📤 FileProcessor: Passando userId ${this.userId} e email ${userEmail} para BatchFileProcessor`);
    const result = await this.batchProcessor.processMultipleFiles(files, this.userId, userEmail);
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
