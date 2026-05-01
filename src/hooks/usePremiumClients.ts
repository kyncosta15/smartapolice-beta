import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PremiumClientRow {
  empresa_id: string;
  empresa_nome: string;
  config_id: string | null;
  premium_ativo: boolean;
  premium_ativado_em: string | null;
  premium_expira_em: string | null;
  premium_observacao: string | null;
  premium_ativado_por: string | null;
  total_casos: number;
}

export function usePremiumClients() {
  return useQuery({
    queryKey: ['consultoria-premium-clients'],
    queryFn: async (): Promise<PremiumClientRow[]> => {
      // Empresas
      const { data: empresas, error: errE } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome', { ascending: true });
      if (errE) throw errE;

      // Configs
      const { data: configs, error: errC } = await supabase
        .from('consultoria_config')
        .select('id, empresa_id, premium_ativo, premium_ativado_em, premium_expira_em, premium_observacao, premium_ativado_por');
      if (errC) throw errC;

      // Casos count by empresa
      const { data: casos } = await supabase
        .from('consultoria_casos')
        .select('empresa_id');
      const counts = new Map<string, number>();
      (casos || []).forEach((c: any) => {
        counts.set(c.empresa_id, (counts.get(c.empresa_id) || 0) + 1);
      });

      const cfgMap = new Map<string, any>();
      (configs || []).forEach((c: any) => cfgMap.set(c.empresa_id, c));

      return (empresas || []).map((e: any) => {
        const cfg = cfgMap.get(e.id);
        return {
          empresa_id: e.id,
          empresa_nome: e.nome,
          config_id: cfg?.id ?? null,
          premium_ativo: !!cfg?.premium_ativo,
          premium_ativado_em: cfg?.premium_ativado_em ?? null,
          premium_expira_em: cfg?.premium_expira_em ?? null,
          premium_observacao: cfg?.premium_observacao ?? null,
          premium_ativado_por: cfg?.premium_ativado_por ?? null,
          total_casos: counts.get(e.id) || 0,
        };
      });
    },
  });
}

export interface TogglePremiumPayload {
  empresa_id: string;
  config_id: string | null;
  ativar: boolean;
  expira_em?: string | null; // YYYY-MM-DD
  observacao?: string | null;
}

export function useTogglePremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TogglePremiumPayload) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const baseFields = {
        premium_ativo: payload.ativar,
        premium_ativado_em: payload.ativar ? new Date().toISOString() : null,
        premium_expira_em: payload.ativar ? (payload.expira_em || null) : null,
        premium_observacao: payload.observacao ?? null,
        premium_ativado_por: payload.ativar ? uid : null,
      };

      if (payload.config_id) {
        const { error } = await supabase
          .from('consultoria_config')
          .update(baseFields)
          .eq('id', payload.config_id);
        if (error) throw error;
      } else {
        // Cria config padrão para a empresa
        const { error } = await supabase.from('consultoria_config').insert({
          empresa_id: payload.empresa_id,
          prompt_mestre: 'Você é um consultor especialista em seguros corporativos da RCaldas. Analise os documentos enviados e identifique lacunas, oportunidades e recomendações estratégicas.',
          tom_voz: 'consultivo',
          modelo_parecer: 'completo',
          criterios: {},
          ...baseFields,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['consultoria-premium-clients'] });
      toast.success(vars.ativar ? 'Cliente Premium ativado' : 'Premium desativado');
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar', { description: err.message });
    },
  });
}
