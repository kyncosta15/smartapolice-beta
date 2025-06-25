
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { usePolicyDataFetch } from '@/hooks/usePolicyDataFetch';
import { N8NWebhookService } from './n8nWebhookService';
import { FileProcessingStatus } from '@/types/pdfUpload';

export class FileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private fetchPolicyData: any;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    fetchPolicyData: any,
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.fetchPolicyData = fetchPolicyData;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
  }

  async processFile(file: File): Promise<void> {
    const fileName = file.name;
    
    // Inicializar status do arquivo
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Enviando arquivo...'
    });

    try {
      // 1. Simular upload progress
      for (let progress = 0; progress <= 50; progress += 25) {
        this.updateFileStatus(fileName, { progress });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 2. Trigger webhook n8n com multipart/form-data
      this.updateFileStatus(fileName, {
        progress: 75,
        status: 'uploading',
        message: 'Enviando PDF para análise da IA...'
      });

      const webhookSuccess = await N8NWebhookService.triggerWebhook(fileName, file);
      
      if (!webhookSuccess) {
        throw new Error('Falha ao comunicar com o workflow de extração');
      }

      // 3. Aguardar processamento via polling
      this.updateFileStatus(fileName, {
        progress: 100,
        status: 'processing',
        message: 'IA analisando documento. Aguarde...'
      });

      const result = await this.fetchPolicyData({
        fileName,
        maxRetries: 8,
        retryInterval: 2500
      });

      if (result.success && result.data) {
        // 4. Sucesso
        this.updateFileStatus(fileName, {
          progress: 100,
          status: 'completed',
          message: `✅ Processado: ${result.data.insurer} - ${result.data.type}`
        });

        this.onPolicyExtracted(result.data);

        this.toast({
          title: "🎉 Apólice Extraída",
          description: `${result.data.name} processada com sucesso`,
        });

        // Remover da lista após 3 segundos
        setTimeout(() => {
          this.removeFileStatus(fileName);
        }, 3000);

      } else {
        throw new Error(result.error || 'Falha no processamento');
      }

    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      
      this.updateFileStatus(fileName, {
        progress: 100,
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });

      this.toast({
        title: "Erro no Processamento",
        description: `Falha ao processar ${fileName}`,
        variant: "destructive",
      });

      // Remover após 5 segundos em caso de erro
      setTimeout(() => {
        this.removeFileStatus(fileName);
      }, 5000);
    }
  }
}
