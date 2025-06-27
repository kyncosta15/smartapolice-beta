export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';

  static async extractFromPDF(file: File): Promise<any> {
    console.log(`🔄 Enviando arquivo individual: ${file.name}`);

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('fileName', file.name);
    formData.append('timestamp', new Date().toISOString());

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Dados extraídos:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro na extração:', error);
      throw new Error(`Falha na extração de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // New method for multiple files with indexed keys
  static async extractFromMultiplePDFs(files: File[]): Promise<any[]> {
    console.log(`🔄 Enviando ${files.length} arquivos para processamento em lote`);

    const formData = new FormData();
    
    // Add each file with indexed keys: arquivo0, arquivo1, arquivo2, etc.
    files.forEach((file, index) => {
      formData.append(`arquivo${index}`, file);
      console.log(`📎 Adicionado arquivo${index}: ${file.name}`);
    });

    // Add metadata
    formData.append('totalFiles', files.length.toString());
    formData.append('timestamp', new Date().toISOString());
    formData.append('batchId', `batch_${Date.now()}`);

    try {
      console.log(`📤 Enviando lote de ${files.length} arquivos para o webhook...`);
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Resposta do webhook recebida:', data);

      // If the response is an array, return it directly
      if (Array.isArray(data)) {
        return data;
      }

      // If the response is a single object, wrap it in an array
      return [data];

    } catch (error) {
      console.error('❌ Erro ao enviar arquivos para o webhook:', error);
      throw new Error(`Falha na comunicação com o webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}
