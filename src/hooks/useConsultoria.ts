import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface ConsultoriaParecer {
  id: string;
  caso_id: string;
  empresa_id: string;
  versao: number;
  status: string;
  resumo_executivo: string | null;
  economia_anual_estimada: number | null;
  oportunidade_capitalizacao_total: number | null;
  estrutura: any;
  ia_modelo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultoriaLacuna {
  id: string;
  parecer_id: string;
  titulo: string;
  categoria: string;
  severidade: string;
  descricao: string | null;
  recomendacao: string | null;
  valor_estimado: number | null;
  cnpj_referencia: string | null;
  ordem: number | null;
}

export type CasoStatus = 'rascunho' | 'em_analise' | 'em_revisao' | 'entregue' | 'arquivado';

export interface ConsultoriaCaso {
  id: string;
  empresa_id: string;
  client_id: string | null;
  titulo: string;
  status: CasoStatus | string;
  tipo_caso: string;
  modo_layout: string;
  cnpjs: string[] | null;
  perfil: any;
  responsaveis: string[] | null;
  revisao_obrigatoria: boolean;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  empresa_nome?: string | null;
}

export interface ConsultoriaConfig {
  id: string;
  empresa_id: string;
  prompt_mestre: string;
  tom_voz: string;
  modelo_parecer: string;
  criterios: any;
  updated_at: string;
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  em_analise: { label: 'Em análise', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  em_revisao: { label: 'Em revisão', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  arquivado: { label: 'Arquivado', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
};

export const TIPO_CASO_LABELS: Record<string, string> = {
  apolice: 'Apólices de seguro',
  consorcio: 'Extratos de consórcio',
  financiamento: 'Minutas de financiamento',
  todos: 'Análise completa',
};

/**
 * Verifica se o usuário logado é admin global (consultor RCaldas).
 */
export function useIsConsultoriaAdmin() {
  return useQuery({
    queryKey: ['is-consultoria-admin'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Lista casos. Admin vê todos; cliente vê só os da empresa ativa.
 */
export function useConsultoriaCasos() {
  const { activeEmpresaId } = useTenant();
  const { data: isAdmin = false } = useIsConsultoriaAdmin();

  return useQuery({
    queryKey: ['consultoria_casos', { isAdmin, activeEmpresaId }],
    queryFn: async () => {
      let q = supabase
        .from('consultoria_casos')
        .select('*, empresas(nome)')
        .order('updated_at', { ascending: false });

      if (!isAdmin) {
        if (!activeEmpresaId) return [] as ConsultoriaCaso[];
        q = q.eq('empresa_id', activeEmpresaId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        empresa_nome: c.empresas?.nome ?? null,
      })) as ConsultoriaCaso[];
    },
    enabled: isAdmin || !!activeEmpresaId,
  });
}

export function useConsultoriaCaso(casoId: string | undefined) {
  return useQuery({
    queryKey: ['consultoria_caso', casoId],
    queryFn: async () => {
      if (!casoId) return null;
      const { data, error } = await supabase
        .from('consultoria_casos')
        .select('*, empresas(nome)')
        .eq('id', casoId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, empresa_nome: (data as any).empresas?.nome ?? null } as ConsultoriaCaso;
    },
    enabled: !!casoId,
  });
}

export function useConsultoriaDocumentos(casoId: string | undefined) {
  return useQuery({
    queryKey: ['consultoria_documentos', casoId],
    queryFn: async () => {
      if (!casoId) return [];
      const { data, error } = await supabase
        .from('consultoria_documentos')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!casoId,
  });
}

export function useConsultoriaConfig(empresaIdOverride?: string | null) {
  const { activeEmpresaId } = useTenant();
  const empresaId = empresaIdOverride ?? activeEmpresaId;
  return useQuery({
    queryKey: ['consultoria_config', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase
        .from('consultoria_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .maybeSingle();
      if (error) throw error;
      return data as ConsultoriaConfig | null;
    },
    enabled: !!empresaId,
  });
}

export function useUpdateConsultoriaConfig(empresaIdOverride?: string | null) {
  const { activeEmpresaId } = useTenant();
  const empresaId = empresaIdOverride ?? activeEmpresaId;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ConsultoriaConfig>) => {
      if (!empresaId) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('consultoria_config')
        .upsert(
          {
            empresa_id: empresaId,
            prompt_mestre: payload.prompt_mestre ?? '',
            tom_voz: payload.tom_voz ?? 'consultivo-tecnico',
            modelo_parecer: payload.modelo_parecer ?? 'rcaldas-padrao-v1',
            criterios: payload.criterios ?? {},
          },
          { onConflict: 'empresa_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultoria_config', empresaId] });
      toast.success('Configurações salvas', { position: 'top-right' });
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar', { description: err.message, position: 'top-right' });
    },
  });
}

export function useCreateCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      empresa_id: string;
      titulo: string;
      tipo_caso: string;
      modo_layout: string;
      cnpjs: string[];
      revisao_obrigatoria: boolean;
      perfil: any;
    }) => {
      if (!payload.empresa_id) throw new Error('Empresa cliente não selecionada');
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('consultoria_casos')
        .insert({
          empresa_id: payload.empresa_id,
          titulo: payload.titulo,
          tipo_caso: payload.tipo_caso,
          modo_layout: payload.modo_layout,
          cnpjs: payload.cnpjs,
          revisao_obrigatoria: payload.revisao_obrigatoria,
          perfil: payload.perfil,
          status: 'rascunho',
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultoria_casos'] });
      toast.success('Caso criado', { position: 'top-right' });
    },
    onError: (err: any) => {
      toast.error('Erro ao criar caso', { description: err.message, position: 'top-right' });
    },
  });
}

/**
 * Upload usa empresa_id do próprio caso (passado explicitamente),
 * não depende mais do TenantContext — funciona para admin sem membership.
 */
export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      casoId,
      empresaId,
      file,
      tipoDocumento,
      cnpjReferencia,
    }: {
      casoId: string;
      empresaId: string;
      file: File;
      tipoDocumento: string;
      cnpjReferencia?: string;
    }) => {
      if (!empresaId) throw new Error('Empresa do caso desconhecida');
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${empresaId}/${casoId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('consultoria-documentos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('consultoria_documentos')
        .insert({
          empresa_id: empresaId,
          caso_id: casoId,
          nome_original: file.name,
          storage_path: path,
          tipo_documento: tipoDocumento,
          tamanho_bytes: file.size,
          cnpj_referencia: cnpjReferencia ?? null,
          uploaded_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['consultoria_documentos', vars.casoId] });
    },
    onError: (err: any) => {
      toast.error('Falha no upload', { description: err.message, position: 'top-right' });
    },
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: { id: string; storage_path: string; caso_id: string }) => {
      await supabase.storage.from('consultoria-documentos').remove([doc.storage_path]);
      const { error } = await supabase
        .from('consultoria_documentos')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
      return doc;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ['consultoria_documentos', doc.caso_id] });
      toast.success('Documento removido', { position: 'top-right' });
    },
  });
}

export function useUpdateCasoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CasoStatus }) => {
      const { error } = await supabase
        .from('consultoria_casos')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultoria_casos'] });
    },
  });
}

export function useConsultoriaPareceres(casoId: string | undefined) {
  return useQuery({
    queryKey: ['consultoria_pareceres', casoId],
    queryFn: async () => {
      if (!casoId) return [] as ConsultoriaParecer[];
      const { data, error } = await supabase
        .from('consultoria_pareceres')
        .select('*')
        .eq('caso_id', casoId)
        .order('versao', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConsultoriaParecer[];
    },
    enabled: !!casoId,
  });
}

export function useConsultoriaParecer(parecerId: string | undefined) {
  return useQuery({
    queryKey: ['consultoria_parecer', parecerId],
    queryFn: async () => {
      if (!parecerId) return null;
      const [{ data: parecer, error: e1 }, { data: lacunas, error: e2 }] = await Promise.all([
        supabase.from('consultoria_pareceres').select('*').eq('id', parecerId).maybeSingle(),
        supabase
          .from('consultoria_lacunas')
          .select('*')
          .eq('parecer_id', parecerId)
          .order('ordem', { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        parecer: parecer as ConsultoriaParecer | null,
        lacunas: (lacunas ?? []) as ConsultoriaLacuna[],
      };
    },
    enabled: !!parecerId,
  });
}

export function useGerarParecer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (casoId: string) => {
      const { data, error } = await supabase.functions.invoke('gerar-parecer-consultoria', {
        body: { casoId },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let msg = error.message;
        try {
          const j = await ctx?.json?.();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, casoId) => {
      qc.invalidateQueries({ queryKey: ['consultoria_caso', casoId] });
      qc.invalidateQueries({ queryKey: ['consultoria_pareceres', casoId] });
      qc.invalidateQueries({ queryKey: ['consultoria_casos'] });
      toast.success('Parecer gerado com sucesso', { position: 'top-right' });
    },
    onError: (err: any) => {
      toast.error('Falha ao gerar parecer', {
        description: err?.message,
        position: 'top-right',
        duration: 8000,
      });
    },
  });
}
