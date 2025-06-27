
export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  private static readonly TIMEOUT = 45000; // Aumentar timeout para 45 segundos
  private static readonly MAX_RETRIES = 3; // Aumentar tentativas
  private static readonly DELAY_BETWEEN_FILES = 2000; // 2 segundos entre arquivos

  static async extractFromPDF(file: File): Promise<any> {
    console.log(`🔄 Enviando arquivo individual: ${file.name} (${file.size} bytes)`);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append('arquivo', file);
        formData.append('fileName', file.name);
        formData.append('timestamp', new Date().toISOString());
        formData.append('fileSize', file.size.toString());

        console.log(`🔄 Tentativa ${attempt}/${this.MAX_RETRIES} para ${file.name}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout após ${this.TIMEOUT}ms para ${file.name}`);
          controller.abort();
        }, this.TIMEOUT);

        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            // Não definir Content-Type para FormData - deixar o browser definir
          }
        });

        clearTimeout(timeoutId);

        console.log(`📡 Resposta recebida para ${file.name}: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        console.log(`📄 Content-Type: ${contentType}`);

        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.log(`📝 Resposta como texto: ${text}`);
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error(`❌ Erro ao fazer parse do JSON: ${parseError}`);
            throw new Error(`Resposta inválida do servidor: ${text}`);
          }
        }

        console.log(`✅ Dados extraídos de ${file.name}:`, data);
        
        // Verificar se os dados são válidos
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error(`Dados vazios retornados para ${file.name}`);
        }

        // Se recebeu um array, retorna o array. Se recebeu um objeto, retorna como array
        return Array.isArray(data) ? data : [data];

      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou para ${file.name}:`, error);
        
        if (error.name === 'AbortError') {
          console.log(`⏰ Timeout para ${file.name} na tentativa ${attempt}`);
        }
        
        if (attempt === this.MAX_RETRIES) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          throw new Error(`Falha na extração de ${file.name} após ${this.MAX_RETRIES} tentativas: ${errorMessage}`);
        }
        
        // Aguardar progressivamente mais tempo entre tentativas
        const retryDelay = 1000 * attempt * 2; // 2s, 4s, 6s
        console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa para ${file.name}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Método para processar múltiplos arquivos com controle melhorado
  static async extractFromMultiplePDFs(files: File[]): Promise<any[]> {
    console.log(`🔄 Processando ${files.length} arquivos com delay entre eles`);
    const resultados = [];

    for (let i = 0; i < files.length; i++) {
      const arquivo = files[i];
      console.log(`📤 Processando arquivo ${i + 1}/${files.length}: ${arquivo.name}`);
      
      try {
        const data = await this.extractFromPDF(arquivo);
        
        // data já vem como array do método extractFromPDF
        resultados.push(...data);
        console.log(`📋 Adicionados ${data.length} itens de ${arquivo.name}`);

        // Pausa maior entre arquivos para evitar sobrecarga do N8N
        if (i < files.length - 1) {
          console.log(`⏳ Aguardando ${this.DELAY_BETWEEN_FILES}ms antes do próximo arquivo`);
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_FILES));
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ${arquivo.name}:`, error);
        // Continuar processando outros arquivos mesmo se um falhar
        // Mas registrar o erro para relatório final
        const errorInfo = {
          fileName: arquivo.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        };
        
        // Adicionar um objeto de erro aos resultados para tracking
        resultados.push({
          _error: true,
          ...errorInfo
        });
      }
    }

    const sucessos = resultados.filter(r => !r._error);
    const erros = resultados.filter(r => r._error);
    
    console.log(`🎉 Processamento completo! ${sucessos.length} sucessos, ${erros.length} erros`);
    
    if (erros.length > 0) {
      console.warn('❌ Arquivos com erro:', erros);
    }

    return sucessos; // Retornar apenas os sucessos
  }
}
