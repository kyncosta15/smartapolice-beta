
import { useState } from 'react';
import { FileProcessingStatus } from '@/types/pdfUpload';

export const useFileStatusManager = () => {
  const [fileStatuses, setFileStatuses] = useState<FileProcessingStatus>({});

  const updateFileStatus = (fileName: string, update: Partial<FileProcessingStatus[string]>) => {
    setFileStatuses(prev => ({
      ...prev,
      [fileName]: { ...prev[fileName], ...update }
    }));
  };

  const removeFileStatus = (fileName: string) => {
    setFileStatuses(prev => {
      const { [fileName]: removed, ...rest } = prev;
      return rest;
    });
  };

  const getActiveFiles = () => Object.keys(fileStatuses);

  const getProcessingCount = () => {
    return getActiveFiles().filter(fileName => 
      ['uploading', 'processing'].includes(fileStatuses[fileName].status)
    ).length;
  };

  return {
    fileStatuses,
    updateFileStatus,
    removeFileStatus,
    getActiveFiles,
    getProcessingCount
  };
};
