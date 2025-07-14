
import { useState, useCallback } from 'react';
import { PDFPasswordService, PDFPasswordStatus, PDFUnlockResult } from '@/services/pdfPasswordService';
import { useToast } from '@/hooks/use-toast';

interface UsePDFPasswordHandlerProps {
  onFileProcessed: (file: File, wasUnlocked: boolean) => void;
  onFileRejected?: (fileName: string, reason: string) => void;
}

export function usePDFPasswordHandler({ onFileProcessed, onFileRejected }: UsePDFPasswordHandlerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<PDFPasswordStatus | null>(null);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    console.log(`🔍 Verificando proteção por senha: ${file.name}`);
    
    // Validar se é um PDF
    if (!PDFPasswordService.validatePDFFile(file)) {
      const errorMessage = 'Arquivo não é um PDF válido';
      console.error(`❌ ${errorMessage}: ${file.name}`);
      onFileRejected?.(file.name, errorMessage);
      return;
    }

    try {
      // Converter para bytes e detectar proteção
      const pdfBytes = await PDFPasswordService.fileToBytes(file);
      const status = await PDFPasswordService.detectPasswordProtection(pdfBytes);
      
      console.log(`📋 Status de proteção para ${file.name}:`, status);
      
      if (status.requiresPassword) {
        // PDF protegido - abrir modal
        console.log(`🔒 PDF protegido detectado: ${file.name}`);
        setCurrentFile(file);
        setPasswordStatus(status);
        setIsModalOpen(true);
        
        toast({
          title: "🔒 PDF Protegido Detectado",
          description: `O arquivo "${file.name}" requer senha para abertura.`,
        });
      } else if (status.canBeUnlocked) {
        // PDF sem proteção - processar normalmente
        console.log(`✅ PDF sem proteção: ${file.name}`);
        onFileProcessed(file, false);
      } else {
        // Erro no arquivo
        const errorMessage = 'Arquivo PDF corrompido ou ilegível';
        console.error(`❌ ${errorMessage}: ${file.name}`);
        onFileRejected?.(file.name, errorMessage);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onFileRejected?.(file.name, errorMessage);
    }
  }, [onFileProcessed, onFileRejected, toast]);

  const handlePasswordSubmit = useCallback(async (password: string): Promise<boolean> => {
    if (!currentFile) {
      console.error('❌ Nenhum arquivo atual para desbloquear');
      return false;
    }

    console.log(`🔓 Tentando desbloquear: ${currentFile.name}`);

    try {
      const pdfBytes = await PDFPasswordService.fileToBytes(currentFile);
      const result: PDFUnlockResult = await PDFPasswordService.unlockPDF(pdfBytes, password);
      
      if (result.success && result.unlockedPdfBytes) {
        console.log(`✅ PDF desbloqueado com sucesso: ${currentFile.name}`);
        
        // Criar novo arquivo sem proteção
        const unlockedFile = PDFPasswordService.bytesToFile(
          result.unlockedPdfBytes,
          currentFile.name,
          currentFile.type
        );
        
        // Processar arquivo desbloqueado
        onFileProcessed(unlockedFile, true);
        
        return true;
      } else {
        console.error(`❌ Falha ao desbloquear: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erro durante desbloqueio:`, error);
      return false;
    }
  }, [currentFile, onFileProcessed]);

  const closeModal = useCallback(() => {
    console.log(`🚫 Modal fechado - arquivo descartado: ${currentFile?.name}`);
    setIsModalOpen(false);
    setCurrentFile(null);
    setPasswordStatus(null);
  }, [currentFile?.name]);

  return {
    isModalOpen,
    currentFile,
    passwordStatus,
    processFile,
    handlePasswordSubmit,
    closeModal
  };
}
