export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://rcorpsolutions.app.n8n.cloud/webhook/upload-arquivo';
  private static readonly TIMEOUT = 120000; // 2 minutos para múltiplos arquivos
  private static readonly MAX_FILES = 10; // Limite de arquivos por requisição

  static async extractFromPDF(file: File, userId?: string): Promise<any> {
    console.log(`🔄 Enviando arquivo individual: ${file.name} (${file.size} bytes)`);
    console.log('📡 Webhook URL:', this.WEBHOOK_URL);
    console.log(`👤 userId: ${userId}`);

    try {
      const formData = new FormData();
      formData.append('file1', file);
      formData.append('timestamp', new Date().toISOString());
      formData.append('totalFiles', '1');
      
      if (userId) {
        formData.append('userId', userId);
        console.log(`✅ userId ${userId} adicionado ao FormData`);
      }

      console.log(`📤 Enviando para: ${this.WEBHOOK_URL}`);

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

      console.log(`📡 Resposta para ${file.name}: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, response.statusText, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength === '0') {
        throw new Error('Resposta vazia do servidor');
      }

      const responseText = await response.text();
      console.log(`📝 Resposta texto (primeiros 200 chars): ${responseText.substring(0, 200)}...`);

      if (!responseText.trim()) {
        throw new Error('Resposta vazia do servidor');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ Erro ao parsear JSON:`, parseError);
        console.error(`📝 Resposta completa: ${responseText}`);
        throw new Error(`Resposta inválida do servidor`);
      }

      console.log(`✅ Dados extraídos de ${file.name}:`, data);
      
      const isArray = Array.isArray(data);
      const resultArray = isArray ? data : [data];
      
      console.log(`📊 Tipo de resposta do N8N: ${isArray ? 'ARRAY' : 'OBJETO ÚNICO'}`);
      console.log(`📊 Total de apólices retornadas pelo N8N: ${resultArray.length}`);
      
      if (resultArray.length > 1) {
        console.log(`🎉 MÚLTIPLAS APÓLICES DETECTADAS NO PDF "${file.name}"`);
        resultArray.forEach((policy, idx) => {
          console.log(`  ${idx + 1}. ${policy.segurado || 'Nome não identificado'} - ${policy.numero_apolice || 'Sem número'}`);
        });
      } else {
        console.log(`ℹ️ Apenas UMA apólice detectada no PDF "${file.name}"`);
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error(`Dados vazios retornados para ${file.name}`);
      }

      return resultArray;

    } catch (error) {
      console.error(`❌ Erro ao processar ${file.name}:`, error);
      throw error;
    }
  }

  static async extractFromMultiplePDFs(files: File[], userId?: string): Promise<any[]> {
    if (files.length > this.MAX_FILES) {
      throw new Error(`Limite de ${this.MAX_FILES} arquivos por vez. Você selecionou ${files.length}.`);
    }

    console.log(`🔄 Enviando ${files.length} arquivos em uma única requisição`);
    console.log(`👤 userId recebido:`, userId);
    console.log(`📡 Endpoint: ${this.WEBHOOK_URL}`);
    
    try {
      const formData = new FormData();
      
      // Adicionar cada arquivo com um nome único (file1, file2, file3, etc)
      files.forEach((file, index) => {
        formData.append(`file${index + 1}`, file);
        console.log(`📎 Arquivo ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      });
      
      // Adicionar metadados
      formData.append('timestamp', new Date().toISOString());
      formData.append('totalFiles', files.length.toString());
      
      if (userId) {
        formData.append('userId', userId);
        console.log(`✅ userId ${userId} adicionado`);
      }

      console.log(`📤 Enviando requisição para o n8n...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Timeout após ${this.TIMEOUT / 1000} segundos`);
        controller.abort();
      }, this.TIMEOUT);

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro no servidor n8n: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📝 Resposta bruta (primeiros 1000 chars):\n${responseText.substring(0, 1000)}`);

      if (!responseText.trim()) {
        throw new Error('Resposta vazia do servidor n8n');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ Erro ao parsear JSON:`, parseError);
        console.error(`Resposta completa:\n${responseText}`);
        throw new Error('Resposta inválida do servidor n8n (não é JSON válido)');
      }

      console.log(`✅ Resposta parseada com sucesso:`, responseData);

      // Extrair apólices da resposta
      // O n8n retorna { apolices: [...] }
      const apolices = responseData.apolices || responseData;
      
      if (!Array.isArray(apolices)) {
        console.warn('⚠️ Resposta não é um array, tentando converter...');
        return [apolices];
      }

      console.log(`🎉 ${apolices.length} apólice(s) extraída(s) com sucesso!`);
      
      // Logar resumo de cada apólice
      apolices.forEach((apolice, idx) => {
        console.log(`  ${idx + 1}. ${apolice.segurado || 'Nome não disponível'} - ${apolice.numero_apolice || 'Sem número'}`);
      });

      return apolices;

    } catch (error) {
      console.error(`❌ ERRO CRÍTICO ao processar arquivos:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tempo esgotado! O processamento demorou mais de 2 minutos. Tente com menos arquivos.');
        }
        throw error;
      }
      
      throw new Error('Erro desconhecido ao processar os arquivos');
    }
  }

  private static createFallbackData(file: File, userId?: string): any[] {
    console.log(`🔄 Criando dados de fallback para ${file.name}`);
    
    const premioAnual = 1200 + Math.random() * 2000;
    const premioMensal = premioAnual / 12;
    
    const mockData = {
      informacoes_gerais: {
        nome_apolice: `Apólice ${file.name.replace('.pdf', '')}`,
        tipo: "Auto",
        status: "Ativa",
        numero_apolice: `POL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      },
      seguradora: {
        empresa: "Seguradora Simulada",
        categoria: "Veicular",
        cobertura: "Cobertura Básica",
        entidade: "Corretora Simulada"
      },
      informacoes_financeiras: {
        premio_anual: premioAnual,
        premio_mensal: premioMensal
      },
      vigencia: {
        inicio: new Date().toISOString().split('T')[0],
        fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        extraido_em: new Date().toISOString().split('T')[0]
      },
      segurado: {
        nome: `Cliente ${file.name.replace('.pdf', '').substring(0, 20)}`,
        documento: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
        tipo_pessoa: 'PF'
      },
      // Campos adicionais necessários para validação
      premio: premioAnual,
      premium: premioAnual,
      user_id: userId,
      documento: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      documento_tipo: 'CPF'
    };

    console.log(`✅ Dados simulados criados para ${file.name}`);
    return [mockData];
  }
}
