import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  ShieldCheck,
  ShieldAlert,
  Car,
  Landmark,
  FolderOpen,
  Mail,
  BarChart3,
  Heart,
  CheckSquare,
  Users2,
  FileSpreadsheet,
  Upload,
  Settings,
  FileText,
} from 'lucide-react';
import { useGlobalSearch, type GlobalResultKind } from '@/hooks/useGlobalSearch';

interface GlobalSearchProps {
  /** Callback do dashboard para navegar entre seções. */
  onNavigateSection?: (section: string) => void;
}

interface SearchItem {
  id: string;
  label: string;
  group: 'Páginas' | 'Central de Apólices' | 'Central de Seguros' | 'Conta';
  icon: typeof Home;
  keywords?: string[];
}

const ITEMS: SearchItem[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Páginas', icon: Home, keywords: ['inicio', 'home', 'kpis', 'visao'] },
  { id: 'claims', label: 'Sinistros', group: 'Páginas', icon: ShieldAlert, keywords: ['ticket', 'sinistro', 'assistencia'] },
  { id: 'frotas', label: 'Gestão de Frotas', group: 'Páginas', icon: Car, keywords: ['veiculo', 'carro', 'placa', 'fleet'] },
  { id: 'documentos', label: 'Documentos', group: 'Páginas', icon: FolderOpen, keywords: ['arquivo', 'pdf', 'central'] },
  { id: 'contatos', label: 'Contatos', group: 'Páginas', icon: Mail, keywords: ['email', 'corretor'] },
  { id: 'export', label: 'Relatórios', group: 'Páginas', icon: BarChart3, keywords: ['report', 'pdf', 'exportar'] },
  { id: 'smartbeneficios', label: 'SmartBenefícios', group: 'Páginas', icon: Heart, keywords: ['saude', 'beneficios'] },
  { id: 'aprovacoes', label: 'Aprovações', group: 'Páginas', icon: CheckSquare, keywords: ['aprovar', 'admin'] },
  { id: 'users', label: 'Vidas e Beneficiários', group: 'Páginas', icon: Users2, keywords: ['colaborador', 'dependente'] },
  { id: 'policies', label: 'Minhas Apólices', group: 'Central de Apólices', icon: FileSpreadsheet, keywords: ['apolice', 'seguros'] },
  { id: 'upload', label: 'Upload de Apólice', group: 'Central de Apólices', icon: Upload, keywords: ['enviar', 'pdf', 'upload'] },
  { id: 'seguro-garantia', label: 'Seguro Garantia', group: 'Central de Seguros', icon: ShieldCheck, keywords: ['garantia', 'judicial', 'caucao'] },
  { id: 'fianca-locaticia', label: 'Fiança Locatícia', group: 'Central de Seguros', icon: Landmark, keywords: ['aluguel', 'imovel', 'fianca'] },
  { id: 'settings', label: 'Configurações', group: 'Conta', icon: Settings, keywords: ['perfil', 'conta', 'preferencias'] },
];

const KIND_META: Record<GlobalResultKind, { label: string; icon: typeof Home }> = {
  apolice: { label: 'Apólices', icon: FileText },
  sinistro: { label: 'Sinistros', icon: ShieldAlert },
  veiculo: { label: 'Veículos', icon: Car },
};

/**
 * Busca global / command palette do header.
 *
 * - Cmd/Ctrl + K abre o diálogo
 * - Resultados estáticos (páginas) + busca server-side em apólices, sinistros e veículos
 * - Ao selecionar um resultado dinâmico, grava hint em sessionStorage para a
 *   página de destino consumir (ex.: pré-filtrar pelo termo / abrir item)
 */
export function GlobalSearch({ onNavigateSection }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading } = useGlobalSearch(query);

  // Atalho global: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Limpa o termo quando o diálogo fecha (UX consistente)
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const handleSelectSection = (sectionId: string) => {
    setOpen(false);
    onNavigateSection?.(sectionId);
  };

  const handleSelectResult = (
    section: string,
    kind: GlobalResultKind,
    id: string,
    title: string
  ) => {
    // Hint para a página de destino abrir/destacar o item específico.
    try {
      sessionStorage.setItem(
        'globalSearch:focus',
        JSON.stringify({ kind, id, title, ts: Date.now() })
      );
    } catch {
      /* ignore quota / private mode */
    }
    setOpen(false);
    onNavigateSection?.(section);
  };

  // Agrupa resultados dinâmicos por tipo
  const dynamicGroups = results.reduce<Record<GlobalResultKind, typeof results>>(
    (acc, r) => {
      (acc[r.kind] ||= []).push(r);
      return acc;
    },
    {} as Record<GlobalResultKind, typeof results>
  );

  // Páginas estáticas
  const staticGroups = ITEMS.reduce<Record<string, SearchItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  const hasDynamic = results.length > 0;
  const showHint = query.trim().length >= 2;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden md:flex h-10 items-center gap-2 px-3 rounded-xl border-border text-muted-foreground hover:bg-accent w-64 justify-between"
        aria-label="Abrir busca global (Ctrl+K)"
      >
        <span className="inline-flex items-center gap-2 text-sm">
          <Search className="size-4" />
          Buscar...
        </span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden h-10 w-10 rounded-xl border-border hover:bg-accent"
        aria-label="Abrir busca global"
      >
        <Search className="size-4 text-muted-foreground" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Busque apólice, sinistro, placa, segurado, página..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {showHint && loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Buscando...
              </span>
            ) : (
              'Nenhum resultado encontrado.'
            )}
          </CommandEmpty>

          {/* Resultados dinâmicos */}
          {hasDynamic && (
            <>
              {(Object.keys(dynamicGroups) as GlobalResultKind[]).map((kind) => {
                const meta = KIND_META[kind];
                const Icon = meta.icon;
                return (
                  <CommandGroup key={kind} heading={meta.label}>
                    {dynamicGroups[kind].map((r) => (
                      <CommandItem
                        key={`${r.kind}-${r.id}`}
                        // value único garante que cmdk não re-filtre nossos resultados server-side
                        value={`${r.kind}-${r.id}-${r.title}`}
                        onSelect={() =>
                          handleSelectResult(r.section, r.kind, r.id, r.title)
                        }
                        className="cursor-pointer"
                      >
                        <Icon className="mr-2 size-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm">{r.title}</span>
                          {r.subtitle && (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {r.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              <CommandSeparator />
            </>
          )}

          {/* Páginas estáticas */}
          {Object.entries(staticGroups).map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const value = [item.label, ...(item.keywords ?? [])].join(' ');
                  return (
                    <CommandItem
                      key={item.id}
                      value={value}
                      onSelect={() => handleSelectSection(item.id)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
