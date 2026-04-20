import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Ticket } from '@/types/tickets';

/**
 * Hook para tickets (sinistros/assistências) detalhados de UM veículo.
 *
 * - TTL 30s (dados dinâmicos): mostra cache instantâneo e revalida em background.
 * - Limite de 50 registros para evitar payloads gigantes.
 * - Habilitado apenas quando `enabled` é true (ex.: aba ativa) → lazy-load.
 */
const TICKETS_LIMIT = 50;

async function fetchVehicleTicketDetails(vehicleId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(TICKETS_LIMIT);

  if (error) throw error;

  return (data || []).map((ticket: any) => ({
    ...ticket,
    descricao: ticket.payload?.descricao,
    gravidade: ticket.payload?.gravidade,
  })) as Ticket[];
}

export function vehicleTicketDetailsKey(vehicleId: string) {
  return ['vehicle-ticket-details', vehicleId] as const;
}

export function useVehicleTicketDetails(vehicleId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: vehicleTicketDetailsKey(vehicleId ?? ''),
    queryFn: () => fetchVehicleTicketDetails(vehicleId!),
    enabled: !!vehicleId && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function usePrefetchVehicleTicketDetails() {
  const qc = useQueryClient();
  return (vehicleId: string) =>
    qc.prefetchQuery({
      queryKey: vehicleTicketDetailsKey(vehicleId),
      queryFn: () => fetchVehicleTicketDetails(vehicleId),
      staleTime: 30_000,
    });
}
