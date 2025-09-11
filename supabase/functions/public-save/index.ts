import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, requestId, token, payload } = await req.json();

    // Validate input
    if (!sessionId || !requestId || !token || !payload) {
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

    // Update session last_seen_at
    await supabase
      .from('public_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Update request with new data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (payload.kind) updateData.kind = payload.kind;
    if (payload.metadata) updateData.metadata = { ...payload.metadata, token };

    const { error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('session_id', sessionId); // Ensure ownership

    if (updateError) {
      console.error('Error updating request:', updateError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao salvar rascunho' }
      }, { headers: corsHeaders });
    }

    // Save/update request items
    if (payload.items && Array.isArray(payload.items)) {
      // Delete existing items for this request
      await supabase
        .from('request_items')
        .delete()
        .eq('request_id', requestId);

      // Insert new items
      const items = payload.items.map((item: any) => ({
        request_id: requestId,
        target: item.target,
        action: item.action,
        dependent_id: item.dependentId || null,
        notes: item.notes || null
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('request_items')
          .insert(items);

        if (itemsError) {
          console.error('Error saving request items:', itemsError);
          return Response.json({
            ok: false,
            error: { code: 'DATABASE_ERROR', message: 'Erro ao salvar itens da solicitação' }
          }, { headers: corsHeaders });
        }
      }
    }

    return Response.json({
      ok: true,
      data: { requestId, sessionId }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in public-save:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
    }, { headers: corsHeaders });
  }
});