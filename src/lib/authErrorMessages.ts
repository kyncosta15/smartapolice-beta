/**
 * Traduz erros técnicos do Supabase/fetch em mensagens amigáveis em PT-BR.
 */
export function translateAuthError(error: unknown): string {
  if (!error) return 'Erro desconhecido. Tente novamente.';

  const raw =
    typeof error === 'string'
      ? error
      : (error as any)?.message || (error as any)?.error_description || String(error);

  const msg = raw.toLowerCase();

  // Erros de rede / serviço fora
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return 'Não foi possível conectar ao servidor. O sistema pode estar instável — verifique o indicador de status no topo da página e tente novamente em instantes.';
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted')) {
    return 'O servidor demorou demais para responder. Tente novamente em alguns segundos.';
  }
  if (msg.includes('networkrequestfailed')) {
    return 'Falha na conexão de rede. Verifique sua internet e tente novamente.';
  }

  // Erros de credenciais
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email ou senha incorretos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.';
  }
  if (msg.includes('user not found')) {
    return 'Usuário não encontrado.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns segundos antes de tentar novamente.';
  }
  if (msg.includes('user already registered')) {
    return 'Este email já está cadastrado.';
  }

  // Edge function offline
  if (msg.includes('functioninvocationerror') || msg.includes('edge function') || msg.includes('non-2xx')) {
    return 'Um serviço auxiliar está temporariamente indisponível. O login principal não é afetado, tente novamente.';
  }

  // Fallback: devolve mensagem original mas sem prefixos técnicos
  return raw.replace(/^Error:\s*/i, '');
}
