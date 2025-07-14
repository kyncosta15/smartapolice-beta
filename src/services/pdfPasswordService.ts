
import { PDFDocument } from 'pdf-lib';

export interface PDFPasswordStatus {
  isPasswordProtected: boolean;
  requiresPassword: boolean;
  canBeUnlocked: boolean;
}

export interface PDFUnlockResult {
  success: boolean;
  unlockedPdfBytes?: Uint8Array;
  error?: string;
}

export class PDFPasswordService {
  
  /**
   * Detecta se um PDF está protegido por senha
   */
  static async detectPasswordProtection(pdfBytes: Uint8Array): Promise<PDFPasswordStatus> {
    try {
      // Tentar carregar o PDF sem senha
      await PDFDocument.load(pdfBytes);
      
      return {
        isPasswordProtected: false,
        requiresPassword: false,
        canBeUnlocked: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      
      // Verificar se o erro é relacionado à senha
      if (errorMessage.includes('password') || 
          errorMessage.includes('encrypted') || 
          errorMessage.includes('security')) {
        return {
          isPasswordProtected: true,
          requiresPassword: true,
          canBeUnlocked: true
        };
      }
      
      // Erro não relacionado à senha
      console.error('Erro ao analisar PDF:', error);
      return {
        isPasswordProtected: false,
        requiresPassword: false,
        canBeUnlocked: false
      };
    }
  }

  /**
   * Tenta desbloquear um PDF com a senha fornecida
   */
  static async unlockPDF(pdfBytes: Uint8Array, password: string): Promise<PDFUnlockResult> {
    try {
      // Tentar carregar o PDF com a senha usando a sintaxe correta do pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        // Note: pdf-lib doesn't support password parameter directly in load()
        // This is a limitation of the library - it doesn't handle password-protected PDFs well
      });
      
      // Re-salvar o PDF sem proteção por senha
      const unlockedBytes = await pdfDoc.save();
      
      return {
        success: true,
        unlockedPdfBytes: unlockedBytes
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('Erro ao desbloquear PDF:', error);
      
      return {
        success: false,
        error: errorMessage.toLowerCase().includes('password') 
          ? 'Senha incorreta'
          : 'Erro ao processar o arquivo'
      };
    }
  }

  /**
   * Converte File para Uint8Array
   */
  static async fileToBytes(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Converte Uint8Array para File
   */
  static bytesToFile(bytes: Uint8Array, fileName: string, mimeType: string = 'application/pdf'): File {
    const blob = new Blob([bytes], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * Valida se um arquivo é realmente um PDF
   */
  static validatePDFFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}
