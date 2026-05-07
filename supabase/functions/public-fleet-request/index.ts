import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { z } from 'https://esm.sh/zod@3.23.8';

const FormDataSchema = z.object({
  tipo: z.string().min(1).max(64),
  motivo: z.string().max(2000).optional().nullable(),
  placa: z.string().trim().max(10).optional().nullable(),
  chassi: z.string().trim().max(32).optional().nullable(),
  renavam: z.string().trim().max(20).optional().nullable(),
  solicitante_nome: z.string().max(200).optional().nullable(),
  solicitante_email: z.string().email().max(255).optional().nullable().or(z.literal('')),
  solicitante_telefone: z.string().max(40).optional().nullable(),
  solicitante_setor: z.string().max(120).optional().nullable(),
  seguradora: z.string().max(160).optional().nullable(),
  numero_apolice: z.string().max(80).optional().nullable(),
  vigencia_inicio: z.string().max(40).optional().nullable(),
  vigencia_fim: z.string().max(40).optional().nullable(),
  cobertura: z.string().max(500).optional().nullable(),
  responsavel_nome: z.string().max(200).optional().nullable(),
  responsavel_telefone: z.string().max(40).optional().nullable(),
  responsavel_email: z.string().email().max(255).optional().nullable().or(z.literal('')),
}).passthrough();

const AnexoSchema = z.object({
  name: z.string().max(255),
  url: z.string().url().max(2048),
  size: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(),
  type: z.string().max(120).optional(),
});

const BodySchema = z.object({
  token: z.string().min(8).max(256),
  formData: FormDataSchema,
  anexos: z.array(AnexoSchema).max(50).optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Received public fleet request:', JSON.stringify(body, null, 2));

    const { token, formData, anexos } = body;

    if (!token || !formData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token e dados do formulário são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar token - aceita tokens permanentes (expires_at null) ou não expirados
    const { data: tokenData, error: tokenError } = await supabase
      .from('public_fleet_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido ou expirado' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gerar código de protocolo
    const protocolCode = generateProtocolCode();

    // Preparar payload para a solicitação
    const payload: any = {
      motivo: formData.motivo,
      solicitante: {
        nome: formData.solicitante_nome,
        email: formData.solicitante_email,
        telefone: formData.solicitante_telefone,
        setor: formData.solicitante_setor,
      },
    };

    // Adicionar dados específicos baseados no tipo
    if (['tirar_do_seguro', 'colocar_no_seguro'].includes(formData.tipo)) {
      payload.seguro = {
        seguradora: formData.seguradora,
        numero_apolice: formData.numero_apolice,
        vigencia_inicio: formData.vigencia_inicio,
        vigencia_fim: formData.vigencia_fim,
        cobertura: formData.cobertura,
      };
    }

    if (formData.tipo === 'mudanca_responsavel') {
      payload.responsavel = {
        nome: formData.responsavel_nome,
        telefone: formData.responsavel_telefone,
        email: formData.responsavel_email,
      };
    }

    // Verificar se existe veículo com a placa/chassi informado
    let vehicleId = null;
    if (formData.placa || formData.chassi) {
      const query = supabase
        .from('frota_veiculos')
        .select('id, marca, modelo, ano_modelo, categoria')
        .eq('empresa_id', tokenData.empresa_id);

      if (formData.placa) query.eq('placa', formData.placa);
      if (formData.chassi) query.eq('chassi', formData.chassi);

      const { data: vehicle } = await query.single();
      if (vehicle) {
        vehicleId = vehicle.id;
      }
    }

    // Criar solicitação
    const { data: request, error: insertError } = await supabase
      .from('fleet_change_requests')
      .insert({
        empresa_id: tokenData.empresa_id,
        user_id: tokenData.created_by,
        vehicle_id: vehicleId,
        tipo: formData.tipo,
        placa: formData.placa?.toUpperCase() || null,
        chassi: formData.chassi?.toUpperCase() || null,
        renavam: formData.renavam || null,
        status: 'aberto',
        prioridade: 'normal',
        payload: {
          ...payload,
          protocol_code: protocolCode,
        },
        anexos: anexos || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      throw insertError;
    }

    // Salvar documentos anexados na tabela específica
    if (anexos && anexos.length > 0) {
      console.log('💾 Salvando documentos:', anexos.length, 'arquivos');
      
      const documentInserts = anexos.map((file: any) => ({
        request_id: request.id,
        file_name: file.name,
        file_url: file.url,
        file_size: file.size,
        mime_type: file.type || getFileTypeFromName(file.name) || 'application/octet-stream'
      }));

      console.log('📋 Documentos para inserir:', JSON.stringify(documentInserts, null, 2));

      const { error: docsError } = await supabase
        .from('fleet_request_documents')
        .insert(documentInserts);

      if (docsError) {
        console.error('❌ Error saving documents:', docsError);
        // Não falhar a solicitação por causa dos documentos
      } else {
        console.log('✅ Documentos salvos com sucesso!');
      }
    } else {
      console.log('📄 Nenhum documento para anexar');
    }

    // Marcar token como usado APENAS após sucesso completo
    const { error: tokenUpdateError } = await supabase
      .from('public_fleet_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Warning: Could not mark token as used:', tokenUpdateError);
      // Não falhar por isso, já que a solicitação foi criada
    }

    console.log('Public fleet request created successfully:', request.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        protocolCode,
        requestId: request.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in public fleet request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateProtocolCode(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `SB-${year}-${timestamp}`;
}

function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}