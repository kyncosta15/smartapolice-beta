
import { DynamicPDFData } from '@/types/pdfUpload';

interface N8NWebhookResponse {
  success: boolean;
  data?: DynamicPDFData;
  message?: string;
  error?: string;
}

export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  
  static async processarPdfComN8n(file: File): Promise<N8NWebhookResponse> {
    console.log(`🌐 Enviando PDF para processamento N8N: ${file.name}`);
    
    try {
      // Criar FormData para envio do arquivo
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('fileName', file.name);
      formData.append('timestamp', new Date().toISOString());

      console.log('📤 Enviando arquivo para webhook N8N...');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as N8NWebhookResponse;
      
      console.log('✅ Resposta recebida do N8N:', result);
      
      if (result.success && result.data) {
        console.log('🎉 Dados processados com sucesso pela IA do N8N!');
        return result;
      } else {
        console.warn('⚠️ N8N retornou sucesso mas sem dados:', result);
        return {
          success: false,
          message: result.message || 'Dados não encontrados na resposta do N8N'
        };
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar PDF no N8N:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF no N8N',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Método para teste de conectividade
  static async testarConexaoN8n(): Promise<boolean> {
    try {
      const testData = new FormData();
      testData.append('test', 'true');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: testData
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }
}
