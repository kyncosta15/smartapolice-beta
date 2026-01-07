// Utilitários JWT para tokens públicos (HMAC-SHA256)
// IMPORTANTE: Este módulo agora só deve ser usado para validação no cliente
// A geração de tokens deve ser feita em Edge Functions com secrets seguros

export interface JWTPayload {
  employeeId: string;
  exp: number;
  iat: number;
}

// Codifica base64url (sem padding)
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Decodifica base64url
function base64urlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

// Decodifica payload JWT sem verificar assinatura (apenas para leitura no cliente)
// A validação real deve ser feita no backend
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [, encodedPayload] = parts;
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as JWTPayload;
    
    // Verifica expiração localmente
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return payload;
  } catch (error) {
    return null;
  }
}

// DEPRECATED: Não usar diretamente - use Edge Functions para gerar tokens
// Mantido apenas para compatibilidade temporária
export async function generateJWT(employeeId: string, validityDays: number = 7): Promise<string> {
  console.warn('⚠️ generateJWT no cliente é inseguro. Use Edge Functions para gerar tokens.');
  throw new Error('Token generation must be done server-side via Edge Functions');
}

// DEPRECATED: Não usar diretamente - use Edge Functions para validar tokens
// Mantido apenas para compatibilidade temporária
export async function validateJWT(token: string): Promise<JWTPayload | null> {
  console.warn('⚠️ validateJWT no cliente não verifica assinatura. Use Edge Functions para validação segura.');
  return decodeJWTPayload(token);
}
