import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Obter secret do ambiente (configurar via Supabase Secrets)
const JWT_SECRET = Deno.env.get('JWT_SECRET') || Deno.env.get('SUPABASE_JWT_SECRET') || '';

interface JWTPayload {
  employeeId: string;
  exp: number;
  iat: number;
}

// Codifica base64url (sem padding)
function base64urlEncode(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// HMAC-SHA256
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
  let binary = '';
  const bytes = new Uint8Array(signature);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Gera JWT seguro
async function generateSecureJWT(employeeId: string, validityDays: number = 7): Promise<string> {
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { employeeId, validityDays = 7 } = await req.json();

    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'employeeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await generateSecureJWT(employeeId, validityDays);

    return new Response(
      JSON.stringify({ token, expiresIn: validityDays * 24 * 60 * 60 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
