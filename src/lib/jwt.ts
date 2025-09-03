// Utilitários JWT para tokens públicos (HMAC-SHA256)

const JWT_SECRET = 'smartbeneficios_secret_2025'; // Em produção usar variável de ambiente

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

// HMAC-SHA256 simples (para produção usar biblioteca crypto)
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

// Gera JWT
export async function generateJWT(employeeId: string, validityDays: number = 7): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (validityDays * 24 * 60 * 60);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload: JWTPayload = {
    employeeId,
    exp,
    iat: now
  };
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await hmacSha256(message, JWT_SECRET);
  
  return `${message}.${signature}`;
}

// Valida e decodifica JWT
export async function validateJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Verifica assinatura
    const expectedSignature = await hmacSha256(message, JWT_SECRET);
    if (signature !== expectedSignature) return null;
    
    // Decodifica payload
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as JWTPayload;
    
    // Verifica expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return payload;
  } catch (error) {
    return null;
  }
}