import { supabase } from '@/integrations/supabase/client';

export type WebhookId = 'pdf_frota' | 'planilha_frota' | 'apolices_pdf';

interface WebhookConfig {
  id: string;
  nome: string;
  url: string;
  ativo: boolean;
}

// Cache das URLs para evitar múltiplas consultas ao banco
let webhookCache: Record<string, WebhookConfig> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todas as configurações de webhooks do banco de dados
 */
export async function fetchWebhookConfigs(): Promise<Record<string, WebhookConfig>> {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (webhookCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return webhookCache;
  }

  try {
    const { data, error } = await supabase
      .from('n8n_webhooks_config')
      .select('id, nome, url, ativo');

    if (error) {
      console.error('Erro ao buscar configurações de webhooks:', error);
      // Retorna URLs fallback em caso de erro
      return getDefaultWebhooks();
    }

    // Criar objeto indexado por ID
    const configs: Record<string, WebhookConfig> = {};
    data?.forEach(config => {
      configs[config.id] = config;
    });

    // Atualizar cache
    webhookCache = configs;
    cacheTimestamp = now;

    return configs;
  } catch (error) {
    console.error('Erro ao buscar configurações de webhooks:', error);
    return getDefaultWebhooks();
  }
}

/**
 * Busca a URL de um webhook específico
 */
export async function getWebhookUrl(webhookId: WebhookId): Promise<string> {
  const configs = await fetchWebhookConfigs();
  const config = configs[webhookId];

  if (!config) {
    console.warn(`Webhook ${webhookId} não encontrado, usando URL padrão`);
    return getDefaultUrl(webhookId);
  }

  if (!config.ativo) {
    console.warn(`Webhook ${webhookId} está desativado`);
  }

  return config.url;
}

/**
 * Verifica se um webhook está ativo
 */
export async function isWebhookActive(webhookId: WebhookId): Promise<boolean> {
  const configs = await fetchWebhookConfigs();
  return configs[webhookId]?.ativo ?? true;
}

/**
 * Limpa o cache de webhooks (útil após atualização)
 */
export function clearWebhookCache(): void {
  webhookCache = null;
  cacheTimestamp = 0;
}

/**
 * URLs padrão (fallback) caso a tabela não esteja configurada
 */
function getDefaultWebhooks(): Record<string, WebhookConfig> {
  return {
    pdf_frota: {
      id: 'pdf_frota',
      nome: 'PDF Frota',
      url: 'https://rcorpcaldas.app.n8n.cloud/webhook/pdf-frota',
      ativo: true,
    },
    planilha_frota: {
      id: 'planilha_frota',
      nome: 'Planilha Frota',
      url: 'https://rcorpcaldas.app.n8n.cloud/webhook/upload-planilha',
      ativo: true,
    },
    apolices_pdf: {
      id: 'apolices_pdf',
      nome: 'Apólices PDF',
      url: 'https://rcorpcaldas.app.n8n.cloud/webhook/upload-arquivo',
      ativo: true,
    },
  };
}

function getDefaultUrl(webhookId: WebhookId): string {
  const defaults = getDefaultWebhooks();
  return defaults[webhookId]?.url || '';
}
