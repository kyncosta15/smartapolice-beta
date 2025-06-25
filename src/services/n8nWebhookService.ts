
export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';

  static async triggerWebhook(fileName: string, file: File): Promise<boolean> {
    try {
      console.log('🚀 Enviando arquivo para n8n via multipart/form-data:', fileName);
      
      // Criar FormData para envio multipart/form-data
      const formData = new FormData();
      
      // Anexar o arquivo no campo 'arquivo' (será acessível via $binary["arquivo"] no n8n)
      formData.append('arquivo', file);
      
      // Anexar dados da apólice como JSON string
      const policyData = {
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString(),
        source: 'SmartApólice',
        event: 'pdf_uploaded'
      };
      
      formData.append('policyData', JSON.stringify(policyData));
      
      console.log(`📄 Arquivo anexado no campo 'arquivo': ${fileName}`);
      console.log(`📝 Dados da apólice:`, policyData);

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        // NÃO definir Content-Type manualmente - o browser define automaticamente com boundary
        body: formData,
      });

      if (response.ok) {
        console.log('✅ Webhook n8n executado com sucesso para:', fileName);
        console.log('📋 Arquivo enviado via multipart/form-data e será acessível via $binary["arquivo"]');
        return true;
      } else {
        console.error('❌ Erro HTTP no webhook n8n:', response.status, response.statusText);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao executar webhook n8n:', error);
      return false;
    }
  }
}
