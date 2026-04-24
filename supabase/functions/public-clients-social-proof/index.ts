import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      throw error;
    }

    const filtered = (data ?? []).filter((company) => {
      const name = (company.nome || '').trim().toLowerCase();

      return (
        !!name &&
        name !== 'clientes individuais' &&
        !name.includes('@gmail.com') &&
        !name.includes('@hotmail.com') &&
        !name.includes('@outlook.com')
      );
    });

    return new Response(
      JSON.stringify({
        total: filtered.length > 0 ? filtered.length : (data ?? []).length,
        clients: filtered.slice(0, 4),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        total: 0,
        clients: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});