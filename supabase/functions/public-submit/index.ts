import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Generate protocol code function
function generateProtocolCode(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `SB-${year}-${timestamp}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, requestId, token } = await req.json();

    // Validate input
    if (!sessionId || !requestId || !token) {
      return Response.json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dados incompletos' }
      }, { headers: corsHeaders });
    }

    // Validate session token
    const { data: tokenValidation, error: tokenError } = await supabase
      .rpc('validate_session_token', { p_token: token });

    if (tokenError || !tokenValidation || tokenValidation.length === 0 || !tokenValidation[0].valid) {
      return Response.json({
        ok: false,
        error: { code: 'INVALID_TOKEN', message: 'Token de sessão inválido ou expirado' }
      }, { headers: corsHeaders });
    }

    const validatedSessionId = tokenValidation[0].session_id;
    
    // Ensure the session matches
    if (validatedSessionId !== sessionId) {
      return Response.json({
        ok: false,
        error: { code: 'SESSION_MISMATCH', message: 'Sessão não corresponde ao token' }
      }, { headers: corsHeaders });
    }

    // Verify session and get request
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*, request_items(*)')
      .eq('id', requestId)
      .eq('session_id', sessionId)
      .eq('draft', true)
      .single();

    if (requestError || !request) {
      return Response.json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Solicitação não encontrada ou já enviada' }
      }, { headers: corsHeaders });
    }

    // Validate request has at least one item
    if (!request.request_items || request.request_items.length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Solicitação deve ter pelo menos um item' }
      }, { headers: corsHeaders });
    }

    // Generate unique protocol code
    const protocolCode = generateProtocolCode();

    // Mark token as used
    await supabase
      .from('session_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Update request to submitted status
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        protocol_code: protocolCode,
        draft: false,
        submitted_at: new Date().toISOString(),
        status: 'recebido',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error submitting request:', updateError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao enviar solicitação' }
      }, { headers: corsHeaders });
    }

    return Response.json({
      ok: true,
      data: { protocol_code: protocolCode }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in public-submit:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
    }, { headers: corsHeaders });
  }
});