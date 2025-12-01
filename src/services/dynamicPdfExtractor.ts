import { getWebhookUrl } from '@/lib/webhookConfig';

export class DynamicPDFExtractor {
  private static async getWebhookUrl(): Promise<string> {
    return getWebhookUrl('apolices_pdf');
  }
  private static readonly TIMEOUT = 600000; // 10 minutos para múltiplos arquivos
  private static readonly MAX_FILES = 10; // Limite de arquivos por requisição

  static async extractFromPDF(file: File, userId?: string): Promise<any> {
    const webhookUrl = await this.getWebhookUrl();
    console.log(`🔄 Enviando arquivo individual: ${file.name} (${file.size} bytes)`);
    console.log('📡 Webhook URL:', webhookUrl);
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

      console.log(`📤 Enviando para: ${webhookUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Timeout após ${this.TIMEOUT}ms para ${file.name}`);
        controller.abort();
      }, this.TIMEOUT);

      const response = await fetch(webhookUrl, {
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
        console.error('❌ N8N retornou resposta vazia - verifique se o workflow está ATIVO no painel N8N');
        throw new Error('Resposta vazia do servidor N8N. Verifique se o workflow está ativo no painel do N8N.');
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
    const webhookUrl = await this.getWebhookUrl();
    console.log('🚀🚀🚀 ==========================================');
    console.log('🚀🚀🚀 INICIANDO extractFromMultiplePDFs');
    console.log('🚀🚀🚀 ==========================================');
    
    if (files.length > this.MAX_FILES) {
      throw new Error(`Limite de ${this.MAX_FILES} arquivos por vez. Você selecionou ${files.length}.`);
    }

    console.log(`🔄 Enviando ${files.length} arquivos em uma única requisição`);
    console.log(`👤 userId recebido:`, userId);
    console.log(`📡 Endpoint: ${webhookUrl}`);
    
    try {
      const formData = new FormData();
      
      console.log('📦 Construindo FormData...');
      
      // Adicionar cada arquivo com um nome único (file1, file2, file3, etc)
      files.forEach((file, index) => {
        const fieldName = `file${index + 1}`;
        formData.append(fieldName, file);
        console.log(`📎 Adicionado campo "${fieldName}": ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      });
      
      // Adicionar metadados
      const timestamp = new Date().toISOString();
      formData.append('timestamp', timestamp);
      formData.append('totalFiles', files.length.toString());
      console.log(`⏰ Timestamp: ${timestamp}`);
      console.log(`📊 Total de arquivos: ${files.length}`);
      
      if (userId) {
        formData.append('userId', userId);
        console.log(`✅ userId ${userId} adicionado ao FormData`);
      } else {
        console.warn('⚠️ Nenhum userId fornecido');
      }

      console.log('📤📤📤 ENVIANDO REQUISIÇÃO PARA O N8N...');
      console.log(`📤 URL: ${webhookUrl}`);
      console.log(`📤 Método: POST`);
      console.log(`📤 Timeout: ${this.TIMEOUT / 1000} segundos`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏰❌ TIMEOUT! Requisição abortada após ${this.TIMEOUT / 1000} segundos`);
        controller.abort();
      }, this.TIMEOUT);

      console.log('🌐 Executando fetch...');
      const fetchStartTime = Date.now();
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const fetchDuration = Date.now() - fetchStartTime;
      clearTimeout(timeoutId);

      console.log('✅✅✅ RESPOSTA RECEBIDA DO N8N!');
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      console.log(`⏱️ Duração: ${fetchDuration}ms`);
      console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro no servidor n8n: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📝 Resposta bruta (primeiros 1000 chars):\n${responseText.substring(0, 1000)}`);

      if (!responseText.trim()) {
        console.error('❌ N8N retornou resposta vazia - verifique se o workflow está ATIVO no painel N8N');
        throw new Error('Resposta vazia do servidor N8N. Verifique se o workflow está ativo no painel do N8N.');
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
      console.log(`📊 Tipo da resposta:`, typeof responseData);
      console.log(`📊 É array?`, Array.isArray(responseData));
      console.log(`📊 Chaves do objeto:`, Object.keys(responseData));
      console.log(`📊 RESPOSTA COMPLETA DO N8N (JSON):`, JSON.stringify(responseData, null, 2));

      // CORREÇÃO: Extrair apólices da resposta com verificação robusta
      // O n8n pode retornar: { apolices: [...] } ou [...] diretamente
      let apolices;
      
      if (responseData.apolices && Array.isArray(responseData.apolices)) {
        console.log('✅ Encontrado campo "apolices" na resposta');
        apolices = responseData.apolices;
      } else if (Array.isArray(responseData)) {
        console.log('✅ Resposta é um array direto');
        apolices = responseData;
      } else {
        console.log('⚠️ Resposta não é array, convertendo para array único');
        apolices = [responseData];
      }
      
      console.log(`📊 Apólices extraídas:`, apolices);
      console.log(`📊 Número de apólices:`, apolices.length);
      
      // Validar se tem dados
      if (!apolices || apolices.length === 0) {
        console.error('❌ Nenhuma apólice encontrada na resposta!');
        console.error('❌ Resposta completa:', JSON.stringify(responseData, null, 2));
        throw new Error('Nenhuma apólice foi retornada pelo N8N');
      }

      console.log(`🎉 ${apolices.length} apólice(s) extraída(s) com sucesso!`);
      
      // Logar resumo de cada apólice COM TODOS OS CAMPOS POSSÍVEIS
      apolices.forEach((apolice, idx) => {
        console.log(`\n📋 APÓLICE ${idx + 1}:`, {
          segurado: apolice.segurado,
          num_segurado: apolice.num_segurado,
          nome_segurado: apolice.nome_segurado,
          seguradora: apolice.seguradora,
          num_seguradora: apolice.num_seguradora,
          numero_apolice: apolice.numero_apolice,
          num_apolice: apolice.num_apolice,
          todasChaves: Object.keys(apolice)
        });
      });

      return apolices;

    } catch (error) {
      console.error(`❌ ERRO CRÍTICO ao processar arquivos:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tempo esgotado! O processamento demorou mais de 10 minutos. Tente com menos arquivos.');
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
