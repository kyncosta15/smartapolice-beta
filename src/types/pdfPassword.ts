
export interface PDFPasswordMetadata {
  originalFileName: string;
  status: 'Desbloqueado com senha' | 'Sem senha' | 'Protegido';
  unlockedAt?: string;
  attempts?: number;
}

export interface PDFProcessingResult {
  file: File;
  wasPasswordProtected: boolean;
  metadata: PDFPasswordMetadata;
}
