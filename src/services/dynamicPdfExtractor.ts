
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

  // Método para processar múltiplos arquivos sequencialmente
  static async extractFromMultiplePDFs(files: File[]): Promise<any[]> {
    console.log(`🔄 Processando ${files.length} arquivos sequencialmente`);
    const resultados = [];

    for (const arquivo of files) {
      console.log(`📤 Processando arquivo: ${arquivo.name}`);
      
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('fileName', arquivo.name);
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
        console.log(`✅ Dados extraídos de ${arquivo.name}:`, data);

        // Verifica se já é array ou único item
        if (Array.isArray(data)) {
          resultados.push(...data);
          console.log(`📋 Adicionados ${data.length} itens do array`);
        } else {
          resultados.push(data);
          console.log(`📋 Adicionado 1 item individual`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ${arquivo.name}:`, error);
        // Continua processando os outros arquivos mesmo se um falhar
        throw new Error(`Falha ao processar ${arquivo.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    console.log(`🎉 Processamento sequencial completo! Total de ${resultados.length} políticas extraídas`);
    return resultados;
  }
}
