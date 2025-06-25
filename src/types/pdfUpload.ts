
export interface FileProcessingStatus {
  [fileName: string]: {
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message: string;
  };
}

export interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: any) => void;
}
