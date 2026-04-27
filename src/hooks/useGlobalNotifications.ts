import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Item de notificação exibido no popover do sino global.
 * Hoje suportamos apenas 'policy_expiring' (apólices próximas do vencimento).
 * O design permite estender para outros tipos no futuro sem quebrar o consumidor.
 */
export interface NotificationItem {
  id: string;
  type: 'policy_expiring';
  title: string;
  description: string;
  /** Data ISO YYYY-MM-DD (string original do banco), sem conversão para Date. */
  isoDate?: string;
  /** Seção de destino para o `onNavigateSection` do dashboard. */
  section: 'policies';
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
 *  - Busca apenas até 5 apólices próximas do vencimento (≤30d) — colunas mínimas
 *  - Sem dependência de RPC nova; usa RLS existente (filtro por user_id)
 *  - Cache de 2 minutos para reduzir chamadas durante navegação
 *  - Erro silencioso (popover fica vazio em vez de quebrar o header)
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

      // Apólices vencendo nos próximos 30 dias (≤5 itens)
      // Usa expiration_date como referência primária; fim_vigencia como fallback é
      // intencionalmente omitido aqui para manter a query rápida e a lista enxuta.
      const { data, error } = await supabase
        .from('policies')
        .select('id, segurado, numero_apolice, expiration_date')
        .eq('user_id', auth.user.id)
        .gte('expiration_date', todayIso)
        .lte('expiration_date', in30Iso)
        .order('expiration_date', { ascending: true })
        .limit(5);

      if (error) {
        console.warn('[useGlobalNotifications] policies query failed:', error.message);
        return EMPTY;
      }

      const items: NotificationItem[] = (data ?? []).map((p) => ({
        id: `pol-${p.id}`,
        type: 'policy_expiring' as const,
        title: p.segurado || 'Apólice sem segurado',
        description: p.numero_apolice
          ? `Vence em ${formatBr(p.expiration_date)} · ${p.numero_apolice}`
          : `Vence em ${formatBr(p.expiration_date)}`,
        isoDate: p.expiration_date ?? undefined,
        section: 'policies' as const,
      }));

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
