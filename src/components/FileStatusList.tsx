
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle, AlertCircle, File } from 'lucide-react';
import { FileProcessingStatus } from '@/types/pdfUpload';

interface FileStatusListProps {
  fileStatuses: FileProcessingStatus;
  activeFiles: string[];
}

export function FileStatusList({ fileStatuses, activeFiles }: FileStatusListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  if (activeFiles.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <h4 className="text-sm font-medium text-gray-700">
        Status do Processamento ({activeFiles.length})
      </h4>
      
      {activeFiles.map((fileName) => {
        const fileStatus = fileStatuses[fileName];
        return (
          <div key={fileName} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(fileStatus.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                  <p className="text-xs text-gray-500">{fileStatus.message}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{fileStatus.progress}%</p>
              </div>
            </div>
            <Progress value={fileStatus.progress} className="mt-2" />
          </div>
        );
      })}
    </div>
  );
}
