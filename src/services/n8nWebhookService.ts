
import { DynamicPDFData } from '@/types/pdfUpload';

interface N8NWebhookPayload {
  fileName: string;
  fileData: string;
  timestamp: string;
  extractedText?: string;
}

interface N8NWebhookResponse {
  success: boolean;
  processId?: string;
  message?: string;
  data?: DynamicPDFData;
}

export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  
  static async sendPDFForProcessing(file: File, extractedText?: string): Promise<N8NWebhookResponse> {
    console.log(`🌐 Enviando PDF para processamento N8N: ${file.name}`);
    
    try {
      // Converter arquivo para base64
      const fileData = await this.fileToBase64(file);
      
      const payload: N8NWebhookPayload = {
        fileName: file.name,
        fileData: fileData,
        timestamp: new Date().toISOString(),
        extractedText: extractedText
      };

      console.log('📤 Enviando dados para webhook N8N...');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as N8NWebhookResponse;
      
      console.log('✅ Resposta recebida do N8N:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao enviar para N8N:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF'
      };
    }
  }

  static async pollForResults(processId: string, maxAttempts: number = 10, intervalMs: number = 3000): Promise<DynamicPDFData | null> {
    console.log(`🔄 Iniciando polling para processo: ${processId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📊 Tentativa ${attempt}/${maxAttempts} - Verificando status...`);
        
        const response = await fetch(`${this.WEBHOOK_URL}/status/${processId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'completed' && result.data) {
            console.log('✅ Processamento concluído!');
            return result.data as DynamicPDFData;
          }
          
          if (result.status === 'failed') {
            console.error('❌ Processamento falhou:', result.error);
            return null;
          }
          
          console.log(`⏳ Status: ${result.status}. Aguardando...`);
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
      } catch (error) {
        console.error(`Erro na tentativa ${attempt}:`, error);
        
        if (attempt === maxAttempts) {
          return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    console.warn('⏰ Timeout atingido para polling');
    return null;
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover o prefixo data:application/pdf;base64,
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Erro ao converter arquivo para base64'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }
}
