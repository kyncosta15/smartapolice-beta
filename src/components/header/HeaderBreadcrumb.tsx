import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mapa central de breadcrumbs por `activeSection`.
 *
 * Cada entrada pode ter um `parent` opcional, que é o ID de outra seção a ser
 * exibida antes (ex.: 'upload' → 'Central de Apólices' → 'Upload de Apólice').
 * Mantém a navegação contextual sem depender de uma stack de rotas real.
 */
const SECTION_LABELS: Record<string, { label: string; parent?: string }> = {
  dashboard: { label: 'Dashboard' },
  policies: { label: 'Minhas Apólices', parent: 'central-apolices' },
  upload: { label: 'Upload de Apólice', parent: 'central-apolices' },
  'central-apolices': { label: 'Central de Apólices' },
  'central-seguros': { label: 'Central de Seguros' },
  'seguro-garantia': { label: 'Seguro Garantia', parent: 'central-seguros' },
  'fianca-locaticia': { label: 'Fiança Locatícia', parent: 'central-seguros' },
  claims: { label: 'Sinistros' },
  frotas: { label: 'Gestão de Frotas' },
  documentos: { label: 'Documentos' },
  contatos: { label: 'Contatos' },
  export: { label: 'Relatórios' },
  smartbeneficios: { label: 'SmartBenefícios' },
  aprovacoes: { label: 'Aprovações' },
  users: { label: 'Vidas e Beneficiários' },
  settings: { label: 'Configurações' },
};

interface HeaderBreadcrumbProps {
  activeSection: string;
  onNavigateSection?: (section: string) => void;
  className?: string;
}

/**
 * Breadcrumb leve, dinâmico, usado no centro do Navbar.
 *
 * - Sempre começa com "Início" (=> dashboard) clicável
 * - Insere o pai (se houver) entre o início e a seção corrente
 * - A seção corrente é texto não-clicável com peso medium
 * - Em telas pequenas é escondido (mobile usa drawer/menu, sem espaço para breadcrumb)
 */
export function HeaderBreadcrumb({
  activeSection,
  onNavigateSection,
  className,
}: HeaderBreadcrumbProps) {
  // Não mostra breadcrumb no próprio dashboard (redundante)
  if (activeSection === 'dashboard' || !SECTION_LABELS[activeSection]) {
    return null;
  }

  const current = SECTION_LABELS[activeSection];
  const parent = current.parent ? SECTION_LABELS[current.parent] : null;

  return (
    <nav
      aria-label="Trilha de navegação"
      className={cn(
        'hidden md:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onNavigateSection?.('dashboard')}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
      >
        <Home className="size-3.5" />
        <span>Início</span>
      </button>

      {parent && current.parent && (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          <button
            type="button"
            onClick={() => onNavigateSection?.(current.parent!)}
            className="hover:text-foreground transition-colors truncate focus-visible:outline-none focus-visible:text-foreground"
          >
            {parent.label}
          </button>
        </>
      )}

      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
      <span className="text-foreground font-medium truncate">{current.label}</span>
    </nav>
  );
}
