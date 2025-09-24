/**
 * Feature Flags para SmartApolice
 * 
 * FEATURE_UI_V2: Migração incremental para Radix UI + React Aria
 * - false: Usa componentes atuais (shadcn/ui)
 * - true: Usa nova UI (Radix + React Aria) com acessibilidade avançada
 * 
 * FEATURE_TABS_V2: TabsRCorp com Headless UI - rollout incremental
 * - false: Usa abas atuais
 * - true: Usa TabsRCorp com Headless UI
 */

export const FEATURE_FLAGS = {
  // UI V2 Migration - Default: false para rollout seguro
  UI_V2: import.meta.env.VITE_FEATURE_UI_V2 === 'true' || false,
  
  // UI V2 por página (override granular)
  UI_V2_FROTAS: import.meta.env.VITE_FEATURE_UI_V2_FROTAS === 'true' || false,
  UI_V2_SINISTROS: import.meta.env.VITE_FEATURE_UI_V2_SINISTROS === 'true' || false,
  UI_V2_FORMS: import.meta.env.VITE_FEATURE_UI_V2_FORMS === 'true' || false,
  UI_V2_TABLES: import.meta.env.VITE_FEATURE_UI_V2_TABLES === 'true' || false,
  
  // Tabs V2 Migration - Ativado para rollout
  TABS_V2: import.meta.env.VITE_FEATURE_TABS_V2 === 'false' ? false : true,
} as const

/**
 * Hook para verificar feature flags de forma tipada
 */
export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag]
}

/**
 * Utilitário para verificar se deve usar UI V2 em uma página específica
 */
export function shouldUseUIV2(page?: 'frotas' | 'sinistros' | 'forms' | 'tables'): boolean {
  // Se a flag global estiver ativa, usa em todo lugar
  if (FEATURE_FLAGS.UI_V2) return true
  
  // Senão, verifica flags específicas por página
  switch (page) {
    case 'frotas':
      return FEATURE_FLAGS.UI_V2_FROTAS
    case 'sinistros':
      return FEATURE_FLAGS.UI_V2_SINISTROS
    case 'forms':
      return FEATURE_FLAGS.UI_V2_FORMS
    case 'tables':
      return FEATURE_FLAGS.UI_V2_TABLES
    default:
      return false
  }
}

/**
 * Utilitário para verificar se deve usar Tabs V2 (TabsRCorp)
 */
export function shouldUseTabsV2(): boolean {
  return FEATURE_FLAGS.TABS_V2
}