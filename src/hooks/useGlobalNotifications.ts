import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Item de notificação exibido no popover do sino global.
 * Tipos suportados (cada um navega para uma seção diferente):
 *  - 'policy_expiring' → seção 'policies'
 *  - 'claim_open'      → seção 'claims'
 */
export interface NotificationItem {
  id: string;
  type: 'policy_expiring' | 'claim_open';
  title: string;
  description: string;
  /** Data ISO YYYY-MM-DD (string original do banco), para evitar timezone shift. */
  isoDate?: string;
  /** Seção de destino para o `onNavigateSection` do dashboard. */
  section: 'policies' | 'claims';
}

export interface NotificationsData {
  items: NotificationItem[];
  /** Quantidade total para o badge do sino (cap em 99+). */
  total: number;
}

const EMPTY: NotificationsData = { items: [], total: 0 };

/**
 * Hook que reúne notificações leves para o sino global do header.
 *
 * Estratégia consciente de custo:
 *  - Busca apenas as 5 apólices próximas do vencimento (≤30d) — colunas mínimas
 *  - Busca apenas os 5 sinistros abertos (status != finalizado/indenizado/negado) — colunas mínimas
 *  - Sem dependência de RPC nova; usa RLS existente (filtro automático por usuário)
 *  - Cache de 2 minutos para reduzir chamadas durante navegação
 */
export function useGlobalNotifications() {
  return useQuery<NotificationsData>({
    queryKey: ['global-notifications'],
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return EMPTY;

      const today = new Date();
      const todayIso = today.toISOString().slice(0, 10);
      const in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);
      const in30Iso = in30.toISOString().slice(0, 10);

      // Apólices vencendo nos próximos 30 dias (cap em 5 itens)
      const expiringPromise = supabase
        .from('policies')
        .select('id, segurado, numero_apolice, expiration_date, fim_vigencia')
        .eq('user_id', auth.user.id)
        .or(`expiration_date.gte.${todayIso},fim_vigencia.gte.${todayIso}`)
        .or(`expiration_date.lte.${in30Iso},fim_vigencia.lte.${in30Iso}`)
        .order('expiration_date', { ascending: true, nullsFirst: false })
        .limit(5);

      // Sinistros abertos (não finalizados)
      const claimsPromise = supabase
        .from('tickets')
        .select('id, numero_ticket, descricao, status, created_at')
        .eq('user_id', auth.user.id)
        .not('status', 'in', '("finalizado","indenizado","negado")')
        .order('created_at', { ascending: false })
        .limit(5);

      const [expiringRes, claimsRes] = await Promise.all([
        expiringPromise,
        claimsPromise,
      ]);

      const expiringRows = (expiringRes.data ?? []) as Array<{
        id: string;
        segurado?: string | null;
        numero_apolice?: string | null;
        expiration_date?: string | null;
        fim_vigencia?: string | null;
      }>;

      const claimRows = (claimsRes.data ?? []) as Array<{
        id: string;
        numero_ticket?: string | null;
        descricao?: string | null;
        status?: string | null;
        created_at?: string | null;
      }>;

      const expiringItems: NotificationItem[] = expiringRows.map((p) => {
        const date = p.expiration_date ?? p.fim_vigencia ?? undefined;
        return {
          id: `pol-${p.id}`,
          type: 'policy_expiring' as const,
          title: p.segurado || 'Apólice sem nome',
          description: p.numero_apolice
            ? `Vence em ${formatBr(date)} · ${p.numero_apolice}`
            : `Vence em ${formatBr(date)}`,
          isoDate: date ?? undefined,
          section: 'policies' as const,
        };
      });

      const claimItems: NotificationItem[] = claimRows.map((t) => ({
        id: `tic-${t.id}`,
        type: 'claim_open' as const,
        title: t.numero_ticket || 'Sinistro em aberto',
        description: (t.descricao || 'Sinistro aguardando tratativa').slice(0, 80),
        isoDate: t.created_at?.slice(0, 10),
        section: 'claims' as const,
      }));

      const items = [...expiringItems, ...claimItems];
      return { items, total: items.length };
    },
  });
}

/** Converte 'YYYY-MM-DD' em 'DD/MM/YYYY' sem usar new Date() (evita drift de timezone). */
function formatBr(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
