import { useQuery } from '@tanstack/react-query';
import { ClaimsService } from '@/services/claims';
import type { Claim, Assistance } from '@/types/claims';

interface UseClaimsParams {
  tipo: 'sinistro' | 'assistencia';
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseClaimsResult {
  data: Claim[] | Assistance[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/**
 * Hook robusto para buscar claims/assistances com React Query
 * Garante que a queryKey é reativa aos filtros e que a paginação reseta ao trocar filtro
 */
export function useClaims({
  tipo,
  status,
  search,
  page = 1,
  limit = 50
}: UseClaimsParams): UseClaimsResult {
  const { data, isLoading, isFetching, error } = useQuery({
    // QueryKey reativa - qualquer mudança nos filtros dispara nova busca
    queryKey: ['claims', { tipo, status, search, page, limit }],
    queryFn: async () => {
      console.log('🔍 useClaims - Buscando dados:', { tipo, status, search, page, limit });
      
      if (tipo === 'assistencia') {
        return await ClaimsService.getAssistances({
          search,
          status,
          page,
          limit
        });
      } else {
        return await ClaimsService.getClaims({
          search,
          status,
          page,
          limit
        });
      }
    },
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isFetching,
    error: error as Error | null
  };
}
