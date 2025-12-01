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
let isFallbackCache = false; // Flag para saber se o cache é de fallback

/**
 * Busca todas as configurações de webhooks do banco de dados
 */
export async function fetchWebhookConfigs(): Promise<Record<string, WebhookConfig>> {
  const now = Date.now();
  
  // Retorna cache se ainda válido E não é fallback
  if (webhookCache && !isFallbackCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Usando cache de webhooks');
    return webhookCache;
  }

  try {
    console.log('🔄 Buscando configurações de webhooks do banco...');
    const { data, error } = await supabase
      .from('n8n_webhooks_config')
      .select('id, nome, url, ativo');

    if (error) {
      console.error('❌ Erro ao buscar configurações de webhooks:', error);
      // Retorna URLs fallback em caso de erro, mas NÃO cacheia
      isFallbackCache = true;
      return getDefaultWebhooks();
    }

    // Se retornou vazio, usar fallback mas não cachear
    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhum webhook encontrado no banco, usando fallback');
      isFallbackCache = true;
      return getDefaultWebhooks();
    }

    // Criar objeto indexado por ID
    const configs: Record<string, WebhookConfig> = {};
    data.forEach(config => {
      configs[config.id] = config;
      console.log(`✅ Webhook carregado: ${config.id} -> ${config.url}`);
    });

    // Atualizar cache apenas com dados reais do banco
    webhookCache = configs;
    cacheTimestamp = now;
    isFallbackCache = false;

    console.log('📦 Cache de webhooks atualizado com dados do banco');
    return configs;
  } catch (error) {
    console.error('❌ Erro ao buscar configurações de webhooks:', error);
    isFallbackCache = true;
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
    console.warn(`⚠️ Webhook ${webhookId} não encontrado, usando URL padrão`);
    return getDefaultUrl(webhookId);
  }

  if (!config.ativo) {
    console.warn(`⚠️ Webhook ${webhookId} está desativado`);
  }

  console.log(`📡 URL do webhook ${webhookId}: ${config.url}`);
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
  console.log('🗑️ Cache de webhooks limpo');
  webhookCache = null;
  cacheTimestamp = 0;
  isFallbackCache = false;
}

/**
 * Força recarregar as configurações do banco (ignora cache)
 */
export async function forceRefreshWebhookConfigs(): Promise<Record<string, WebhookConfig>> {
  clearWebhookCache();
  return fetchWebhookConfigs();
}

/**
 * URLs padrão (fallback) caso a tabela não esteja configurada
 */
function getDefaultWebhooks(): Record<string, WebhookConfig> {
  console.log('⚠️ Usando URLs de fallback (dados não encontrados no banco)');
  return {
    pdf_frota: {
      id: 'pdf_frota',
      nome: 'PDF Frota',
      url: 'https://gruporcaldas2025.app.n8n.cloud/webhook/pdf-frota',
      ativo: true,
    },
    planilha_frota: {
      id: 'planilha_frota',
      nome: 'Planilha Frota',
      url: 'https://gruporcaldas2025.app.n8n.cloud/webhook/upload-planilha',
      ativo: true,
    },
    apolices_pdf: {
      id: 'apolices_pdf',
      nome: 'Apólices PDF',
      url: 'https://gruporcaldas2025.app.n8n.cloud/webhook/upload-arquivo',
      ativo: true,
    },
  };
}

function getDefaultUrl(webhookId: WebhookId): string {
  const defaults = getDefaultWebhooks();
  return defaults[webhookId]?.url || '';
}
