import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
} from 'lucide-react';

interface GlobalSearchProps {
  /** Callback do dashboard para navegar entre seções. */
  onNavigateSection?: (section: string) => void;
}

/**
 * Item navegável do command palette.
 * Mantém um catálogo plano para suportar busca textual rápida e atalhos.
 */
interface SearchItem {
  id: string;
  label: string;
  group: 'Páginas' | 'Central de Apólices' | 'Central de Seguros' | 'Conta';
  icon: typeof Home;
  /** Sinônimos extras para casar com termos comuns digitados pelo usuário. */
  keywords?: string[];
}

const ITEMS: SearchItem[] = [
  // Páginas principais
  { id: 'dashboard', label: 'Dashboard', group: 'Páginas', icon: Home, keywords: ['inicio', 'home', 'kpis', 'visao'] },
  { id: 'claims', label: 'Sinistros', group: 'Páginas', icon: ShieldAlert, keywords: ['ticket', 'sinistro', 'assistencia'] },
  { id: 'frotas', label: 'Gestão de Frotas', group: 'Páginas', icon: Car, keywords: ['veiculo', 'carro', 'placa', 'fleet'] },
  { id: 'documentos', label: 'Documentos', group: 'Páginas', icon: FolderOpen, keywords: ['arquivo', 'pdf', 'central'] },
  { id: 'contatos', label: 'Contatos', group: 'Páginas', icon: Mail, keywords: ['email', 'corretor'] },
  { id: 'export', label: 'Relatórios', group: 'Páginas', icon: BarChart3, keywords: ['report', 'pdf', 'exportar'] },
  { id: 'smartbeneficios', label: 'SmartBenefícios', group: 'Páginas', icon: Heart, keywords: ['saude', 'beneficios'] },
  { id: 'aprovacoes', label: 'Aprovações', group: 'Páginas', icon: CheckSquare, keywords: ['aprovar', 'admin'] },
  { id: 'users', label: 'Vidas e Beneficiários', group: 'Páginas', icon: Users2, keywords: ['colaborador', 'dependente'] },

  // Central de Apólices
  { id: 'policies', label: 'Minhas Apólices', group: 'Central de Apólices', icon: FileSpreadsheet, keywords: ['apolice', 'seguros'] },
  { id: 'upload', label: 'Upload de Apólice', group: 'Central de Apólices', icon: Upload, keywords: ['enviar', 'pdf', 'upload'] },

  // Central de Seguros
  { id: 'seguro-garantia', label: 'Seguro Garantia', group: 'Central de Seguros', icon: ShieldCheck, keywords: ['garantia', 'judicial', 'caucao'] },
  { id: 'fianca-locaticia', label: 'Fiança Locatícia', group: 'Central de Seguros', icon: Landmark, keywords: ['aluguel', 'imovel', 'fianca'] },

  // Conta
  { id: 'settings', label: 'Configurações', group: 'Conta', icon: Settings, keywords: ['perfil', 'conta', 'preferencias'] },
];

/**
 * Busca global / command palette do header.
 *
 * - Atalho universal: Cmd/Ctrl + K abre o diálogo
 * - Filtragem é feita pelo cmdk (busca por label + keywords)
 * - Selecionar um item dispara `onNavigateSection` e fecha o diálogo
 *
 * Hoje só suporta navegação por seção. Busca de dados (ex.: encontrar uma
 * apólice específica) é uma extensão natural sem mudar a API deste componente.
 */
export function GlobalSearch({ onNavigateSection }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);

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

  const handleSelect = (sectionId: string) => {
    setOpen(false);
    onNavigateSection?.(sectionId);
  };

  // Agrupa items dinamicamente para alimentar <CommandGroup>
  const groups = ITEMS.reduce<Record<string, SearchItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Trigger visual: campo "fake" que parece um input mas abre o dialog */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden md:flex h-10 items-center gap-2 px-3 rounded-xl border-border text-muted-foreground hover:bg-accent w-64 justify-between"
        aria-label="Abrir busca global (Ctrl+K)"
      >
        <span className="inline-flex items-center gap-2 text-sm">
          <Search className="size-4" />
          Buscar páginas...
        </span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Versão compacta para mobile (apenas ícone) */}
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
        <CommandInput placeholder="Busque por seção, página ou ação..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {Object.entries(groups).map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => {
                  const Icon = item.icon;
                  // value combina label + keywords para o cmdk fazer fuzzy match
                  const value = [item.label, ...(item.keywords ?? [])].join(' ');
                  return (
                    <CommandItem
                      key={item.id}
                      value={value}
                      onSelect={() => handleSelect(item.id)}
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
