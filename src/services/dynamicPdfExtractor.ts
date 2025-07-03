
export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://smartapolice.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  private static readonly TIMEOUT = 60000; // 60 segundos para múltiplos arquivos
  private static readonly MAX_RETRIES = 3;

  static async extractFromPDF(file: File, userId?: string): Promise<any> {
    console.log(`🔄 Enviando arquivo individual: ${file.name} (${file.size} bytes)`);
    console.log(`👤 GARANTINDO: userId ${userId} será incluído no FormData individual`);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append('arquivo', file);
        formData.append('fileName', file.name);
        formData.append('timestamp', new Date().toISOString());
        formData.append('fileSize', file.size.toString());
        
        // ✅ GARANTIR que userId seja incluído no FormData
        if (userId) {
          formData.append('userId', userId);
          console.log(`✅ ✅ CONFIRMADO: userId ${userId} adicionado ao FormData individual`);
        } else {
          console.warn(`⚠️ ATENÇÃO: userId não fornecido para arquivo individual ${file.name}`);
        }

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
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error(`Dados vazios retornados para ${file.name}`);
        }

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
        
        const retryDelay = 1000 * attempt * 2;
        console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa para ${file.name}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Novo método para enviar múltiplos arquivos de uma vez
  static async extractFromMultiplePDFs(files: File[], userId?: string): Promise<any[]> {
    console.log(`🔄 Enviando ${files.length} arquivos de uma vez para o N8N`);
    console.log(`👤 GARANTINDO: userId ${userId} será incluído no FormData batch`);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        
        // Adicionar cada arquivo com índice
        files.forEach((file, index) => {
          formData.append(`arquivo${index}`, file);
          formData.append(`fileName${index}`, file.name);
          formData.append(`fileSize${index}`, file.size.toString());
        });
        
        // Adicionar metadados gerais
        formData.append('totalFiles', files.length.toString());
        formData.append('timestamp', new Date().toISOString());
        formData.append('batchUpload', 'true');
        
        // ✅ GARANTIR que userId seja incluído no FormData
        if (userId) {
          formData.append('userId', userId);
          console.log(`✅ ✅ CONFIRMADO: userId ${userId} adicionado ao FormData batch`);
        } else {
          console.warn(`⚠️ ATENÇÃO: userId não fornecido para batch de ${files.length} arquivos`);
        }

        console.log(`🔄 Tentativa ${attempt}/${this.MAX_RETRIES} para batch de ${files.length} arquivos`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout após ${this.TIMEOUT}ms para batch upload`);
          controller.abort();
        }, this.TIMEOUT);

        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📡 Resposta recebida para batch: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.log(`📝 Resposta batch como texto: ${text}`);
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error(`❌ Erro ao fazer parse do JSON batch: ${parseError}`);
            throw new Error(`Resposta inválida do servidor: ${text}`);
          }
        }

        console.log(`✅ Dados brutos extraídos do batch:`, data);
        
        if (!data) {
          throw new Error('Dados vazios retornados do batch');
        }

        // CORREÇÃO PRINCIPAL: Garantir que sempre retornamos um array
        let resultArray: any[];
        
        if (Array.isArray(data)) {
          resultArray = data;
          console.log(`📦 Dados já são um array com ${resultArray.length} itens`);
        } else {
          resultArray = [data];
          console.log(`📦 Convertendo objeto único para array com 1 item`);
        }
        
        console.log(`📦 Retornando ${resultArray.length} apólices do batch processadas individualmente`);
        
        return resultArray;

      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou para batch:`, error);
        
        if (error.name === 'AbortError') {
          console.log(`⏰ Timeout para batch na tentativa ${attempt}`);
        }
        
        if (attempt === this.MAX_RETRIES) {
          console.log(`❌ Batch falhou após ${this.MAX_RETRIES} tentativas, tentando individualmente`);
          
          // Fallback: tentar processar arquivos individualmente
          return await this.fallbackToIndividualProcessing(files, userId);
        }
        
        const retryDelay = 2000 * attempt;
        console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa do batch`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return [];
  }

  // Método de fallback para processamento individual
  private static async fallbackToIndividualProcessing(files: File[], userId?: string): Promise<any[]> {
    console.log(`🔄 Iniciando processamento individual como fallback para ${files.length} arquivos`);
    console.log(`👤 GARANTINDO: userId ${userId} será incluído em cada FormData individual do fallback`);
    const resultados = [];

    for (let i = 0; i < files.length; i++) {
      const arquivo = files[i];
      console.log(`📤 Processando individualmente arquivo ${i + 1}/${files.length}: ${arquivo.name}`);
      
      try {
        const data = await this.extractFromPDF(arquivo, userId);
        resultados.push(...data);
        
        // Pausa entre arquivos individuais
        if (i < files.length - 1) {
          console.log(`⏳ Aguardando 3s antes do próximo arquivo individual`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Erro no processamento individual de ${arquivo.name}:`, error);
        // Continuar com outros arquivos
      }
    }

    console.log(`🎉 Processamento individual completo! ${resultados.length} apólices extraídas`);
    return resultados;
  }
}
