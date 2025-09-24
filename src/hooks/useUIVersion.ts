import { shouldUseUIV2 } from '@/config/features'

/**
 * Hook para determinar qual versão da UI usar baseado nas feature flags
 */
export function useUIVersion(page?: 'frotas' | 'sinistros' | 'forms' | 'tables') {
  return {
    useV2: shouldUseUIV2(page),
    // Helpers para componentes específicos
    DropdownComponent: shouldUseUIV2(page) ? 'v2' : 'v1',
    DialogComponent: shouldUseUIV2(page) ? 'v2' : 'v1',
  }
}