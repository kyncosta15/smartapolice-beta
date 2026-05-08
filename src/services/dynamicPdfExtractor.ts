import { getWebhookUrl, isWebhookActive } from '@/lib/webhookConfig';
import { supabase } from '@/integrations/supabase/client';

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

async function extractViaSmartFallback(file: File, userId?: string | null): Promise<any> {
  console.log(`🧠 [Fallback nativo] Processando ${file.name} via smart-apolice-extract`);
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke('smart-apolice-extract', {
    body: { filename: file.name, base64, save: true },
  });
  if (error) {
    console.error('❌ smart-apolice-extract erro:', error);
    let errorMessage = error.message || 'Falha na extração nativa (smart-apolice-extract)';
    const ctx = (error as any)?.context;

    if (ctx && typeof ctx.clone === 'function' && typeof ctx.text === 'function') {
      try {
        const text = await ctx.clone().text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            errorMessage = parsed?.error || parsed?.message || errorMessage;
          } catch {
            errorMessage = text;
          }
        }
      } catch {
        // noop
      }
    } else if (ctx?.body) {
      try {
        const parsed = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {
        if (typeof ctx.body === 'string' && ctx.body.trim()) errorMessage = ctx.body;
      }
    }

    throw new Error(errorMessage);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (!data?.apolice) {
    throw new Error('Extração nativa retornou sem apólice');
  }
  console.log(`✅ [Fallback nativo] ${file.name} processado:`, data.apolice);
  return data.apolice;
}

export class DynamicPDFExtractor {
  private static async resolveMode(): Promise<'n8n' | 'native'> {
    const ativo = await isWebhookActive('apolices_pdf');
    return ativo ? 'n8n' : 'native';
  }

  private static async getWebhookUrl(): Promise<string> {
    return getWebhookUrl('apolices_pdf');
  }
  private static readonly TIMEOUT = 600000; // 10 minutos para múltiplos arquivos
  private static readonly MAX_FILES = 10; // Limite de arquivos por requisição

  static async extractFromPDF(file: File, userId?: string): Promise<any> {
    const mode = await this.resolveMode();

    if (mode === 'native') {
      console.log(`🧠 Webhook desativado — usando extração nativa para ${file.name}`);
      const apolice = await extractViaSmartFallback(file, userId);
      return [apolice];
    }

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
    const mode = await this.resolveMode();

    if (mode === 'native') {
      console.log(`🧠 Webhook desativado — usando extração nativa para ${files.length} arquivo(s)`);
      const results: any[] = [];
      for (const file of files) {
        try {
          const apolice = await extractViaSmartFallback(file, userId);
          results.push(apolice);
        } catch (err) {
          console.error(`❌ Falha extração nativa em ${file.name}:`, err);
          throw err;
        }
      }
      return results;
    }

    const webhookUrl = await this.getWebhookUrl();
    console.log('🚀 INICIANDO extractFromMultiplePDFs (N8N)');
    
    if (files.length > this.MAX_FILES) {
      throw new Error(`Limite de ${this.MAX_FILES} arquivos por vez. Você selecionou ${files.length}.`);
    }

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index + 1}`, file);
      });
      formData.append('timestamp', new Date().toISOString());
      formData.append('totalFiles', files.length.toString());
      if (userId) formData.append('userId', userId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no servidor n8n: ${response.status} - ${response.statusText} ${errorText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Resposta vazia do servidor N8N. Verifique se o workflow está ativo.');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error('Resposta inválida do servidor n8n (não é JSON válido)');
      }

      let apolices;
      if (responseData.apolices && Array.isArray(responseData.apolices)) {
        apolices = responseData.apolices;
      } else if (Array.isArray(responseData)) {
        apolices = responseData;
      } else {
        apolices = [responseData];
      }

      if (!apolices || apolices.length === 0) {
        throw new Error('Nenhuma apólice foi retornada pelo N8N');
      }

      return apolices;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo esgotado! O processamento demorou mais de 10 minutos.');
      }
      throw error;
    }
  }
}
