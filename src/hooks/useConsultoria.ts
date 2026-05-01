import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

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

export function useConsultoriaCasos() {
  const { activeEmpresaId } = useTenant();

  return useQuery({
    queryKey: ['consultoria_casos', activeEmpresaId],
    queryFn: async () => {
      if (!activeEmpresaId) return [] as ConsultoriaCaso[];
      const { data, error } = await supabase
        .from('consultoria_casos')
        .select('*')
        .eq('empresa_id', activeEmpresaId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConsultoriaCaso[];
    },
    enabled: !!activeEmpresaId,
  });
}

export function useConsultoriaCaso(casoId: string | undefined) {
  return useQuery({
    queryKey: ['consultoria_caso', casoId],
    queryFn: async () => {
      if (!casoId) return null;
      const { data, error } = await supabase
        .from('consultoria_casos')
        .select('*')
        .eq('id', casoId)
        .maybeSingle();
      if (error) throw error;
      return data as ConsultoriaCaso | null;
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

export function useConsultoriaConfig() {
  const { activeEmpresaId } = useTenant();
  return useQuery({
    queryKey: ['consultoria_config', activeEmpresaId],
    queryFn: async () => {
      if (!activeEmpresaId) return null;
      const { data, error } = await supabase
        .from('consultoria_config')
        .select('*')
        .eq('empresa_id', activeEmpresaId)
        .maybeSingle();
      if (error) throw error;
      return data as ConsultoriaConfig | null;
    },
    enabled: !!activeEmpresaId,
  });
}

export function useUpdateConsultoriaConfig() {
  const { activeEmpresaId } = useTenant();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ConsultoriaConfig>) => {
      if (!activeEmpresaId) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('consultoria_config')
        .upsert(
          {
            empresa_id: activeEmpresaId,
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
      qc.invalidateQueries({ queryKey: ['consultoria_config', activeEmpresaId] });
      toast.success('Configurações salvas', { position: 'top-right' });
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar', { description: err.message, position: 'top-right' });
    },
  });
}

export function useCreateCaso() {
  const { activeEmpresaId } = useTenant();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      titulo: string;
      tipo_caso: string;
      modo_layout: string;
      cnpjs: string[];
      revisao_obrigatoria: boolean;
      perfil: any;
    }) => {
      if (!activeEmpresaId) throw new Error('Empresa não selecionada');
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('consultoria_casos')
        .insert({
          empresa_id: activeEmpresaId,
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
      qc.invalidateQueries({ queryKey: ['consultoria_casos', activeEmpresaId] });
      toast.success('Caso criado', { position: 'top-right' });
    },
    onError: (err: any) => {
      toast.error('Erro ao criar caso', { description: err.message, position: 'top-right' });
    },
  });
}

export function useUploadDocumento() {
  const { activeEmpresaId } = useTenant();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      casoId,
      file,
      tipoDocumento,
      cnpjReferencia,
    }: {
      casoId: string;
      file: File;
      tipoDocumento: string;
      cnpjReferencia?: string;
    }) => {
      if (!activeEmpresaId) throw new Error('Empresa não selecionada');
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${activeEmpresaId}/${casoId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('consultoria-documentos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('consultoria_documentos')
        .insert({
          empresa_id: activeEmpresaId,
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
  const { activeEmpresaId } = useTenant();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CasoStatus }) => {
      const { error } = await supabase
        .from('consultoria_casos')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultoria_casos', activeEmpresaId] });
    },
  });
}
