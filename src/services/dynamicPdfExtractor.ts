
export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  private static readonly TIMEOUT = 30000; // 30 segundos
  private static readonly MAX_RETRIES = 2;

  static async extractFromPDF(file: File): Promise<any> {
    console.log(`🔄 Enviando arquivo individual: ${file.name}`);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append('arquivo', file);
        formData.append('fileName', file.name);
        formData.append('timestamp', new Date().toISOString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Dados extraídos de ${file.name}:`, data);
        
        // Se recebeu um array, retorna o array. Se recebeu um objeto, retorna como array
        return Array.isArray(data) ? data : [data];

      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou para ${file.name}:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Falha na extração de ${file.name} após ${this.MAX_RETRIES} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Método para processar múltiplos arquivos sequencialmente
  static async extractFromMultiplePDFs(files: File[]): Promise<any[]> {
    console.log(`🔄 Processando ${files.length} arquivos sequencialmente`);
    const resultados = [];

    for (let i = 0; i < files.length; i++) {
      const arquivo = files[i];
      console.log(`📤 Processando arquivo ${i + 1}/${files.length}: ${arquivo.name}`);
      
      try {
        const data = await this.extractFromPDF(arquivo);
        
        // data já vem como array do método extractFromPDF
        resultados.push(...data);
        console.log(`📋 Adicionados ${data.length} itens de ${arquivo.name}`);

        // Pequena pausa entre arquivos para evitar sobrecarga
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ${arquivo.name}:`, error);
        // Continue processando outros arquivos mesmo se um falhar
        throw new Error(`Falha ao processar ${arquivo.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    console.log(`🎉 Processamento sequencial completo! Total de ${resultados.length} políticas extraídas`);
    return resultados;
  }
}
