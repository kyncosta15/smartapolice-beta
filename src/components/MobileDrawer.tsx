import React, { useEffect, useState } from 'react';
import {
  X,
  LayoutDashboard,
  FileText,
  Upload,
  AlertTriangle,
  Car,
  ShieldCheck,
  Building2,
  FolderOpen,
  Mail,
  BarChart3,
  Heart,
  Shield,
  LogOut,
  Users2,
  CheckSquare,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import smartControlShield from '@/assets/smartcontrol-shield.png';

// (prop legada `navigation` é ignorada — sections agora são construídas internamente
// para manter paridade visual com a AppSidebar desktop)
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation?: unknown;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'docs' | 'sinistros';
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export function MobileDrawer({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: MobileDrawerProps) {
  const { user, profile, logout } = useAuth();
  const { activeEmpresaId } = useTenant();
  const navigate = useNavigate();
  const [docCount, setDocCount] = useState<number>(0);
  const [sinistrosCount, setSinistrosCount] = useState<number>(0);

  // ===== Counters (mesma lógica da AppSidebar) =====
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      let query = supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);
      if (activeEmpresaId) query = query.eq('account_id', activeEmpresaId);
      const { count } = await query;
      setDocCount(count ?? 0);
    };
    fetchCount();
    const channel = supabase
      .channel('mobile-doc-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeEmpresaId]);

  useEffect(() => {
    if (!user) return;
    const fetchSinistrosCount = async () => {
      const OPEN_STATUSES = ['aberto', 'em_analise', 'em_andamento', 'open'];
      const CLOSED_STATUSES = ['finalizado', 'finalizado_inatividade', 'encerrado', 'pago', 'closed', 'indenizado', 'negado'];
      const { data } = await supabase
        .from('tickets')
        .select('status, status_indenizacao')
        .eq('tipo', 'sinistro');
      const rows = data ?? [];
      let openN = 0;
      for (const r of rows) {
        const s = (r.status ?? '').toLowerCase();
        const si = (r.status_indenizacao ?? '').toLowerCase();
        const isClosed = CLOSED_STATUSES.includes(s) || (si && CLOSED_STATUSES.includes(si));
        if (!isClosed && OPEN_STATUSES.includes(s)) openN++;
      }
      setSinistrosCount(openN);
    };
    fetchSinistrosCount();
    const channel = supabase
      .channel('mobile-sinistros-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchSinistrosCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // ESC para fechar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const isAdmin = profile?.is_admin === true;

  const handleNavigate = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose();
  };

  const clientSections: NavSection[] = [
    { items: [{ id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Apólices',
      items: [
        { id: 'policies', title: 'Minhas Apólices', icon: FileText },
        { id: 'upload', title: 'Upload', icon: Upload },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { id: 'claims', title: 'Sinistros', icon: AlertTriangle, badge: 'sinistros' },
        { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
      ],
    },
    {
      label: 'Seguros',
      items: [
        { id: 'seguro-garantia', title: 'Seguro Garantia', icon: ShieldCheck },
        { id: 'fianca-locaticia', title: 'Fiança Locatícia', icon: Building2 },
      ],
    },
    {
      label: 'Conteúdo',
      items: [
        { id: 'documentos', title: 'Documentos', icon: FolderOpen, badge: 'docs' },
        { id: 'contatos', title: 'Contatos', icon: Mail },
        { id: 'export', title: 'Relatórios', icon: BarChart3 },
        { id: 'smartbeneficios', title: 'SmartBenefícios', icon: Heart },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    { items: [{ id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Apólices',
      items: [
        { id: 'policies', title: 'Minhas Apólices', icon: FileText },
        { id: 'upload', title: 'Upload', icon: Upload },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { id: 'users', title: 'Vidas e Beneficiários', icon: Users2 },
        { id: 'claims', title: 'Sinistros', icon: AlertTriangle, badge: 'sinistros' },
        { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
        { id: 'aprovacoes', title: 'Aprovações', icon: CheckSquare },
      ],
    },
    {
      label: 'Seguros',
      items: [
        { id: 'seguro-garantia', title: 'Seguro Garantia', icon: ShieldCheck },
        { id: 'fianca-locaticia', title: 'Fiança Locatícia', icon: Building2 },
      ],
    },
    {
      label: 'Conteúdo',
      items: [
        { id: 'documentos', title: 'Documentos', icon: FolderOpen, badge: 'docs' },
        { id: 'contatos', title: 'Contatos', icon: Mail },
        { id: 'export', title: 'Relatórios', icon: BarChart3 },
        { id: 'smartbeneficios', title: 'SmartBenefícios', icon: Heart },
      ],
    },
  ];

  const sections = isAdmin ? adminSections : clientSections;

  const userName = profile?.full_name || (user as any)?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const userRole = isAdmin
    ? 'Admin'
    : (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Usuário');

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer (mesmo visual da AppSidebar) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          'fixed inset-y-0 left-0 w-[85%] max-w-[300px] z-50 shadow-2xl flex flex-col',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ===== Header: Logo SmartControl + close ===== */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={smartControlShield}
              alt="SmartControl"
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="flex items-baseline leading-none">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Smart</span>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[hsl(190,100%,50%)] via-[hsl(220,100%,60%)] to-[hsl(260,100%,60%)] bg-clip-text text-transparent">Control</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 hover:bg-sidebar-accent/60 rounded-md h-8 w-8"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* ===== Navigation ===== */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {/* Botão Painel Admin */}
          {isAdmin && (
            <div className="mb-2 px-1">
              <Button
                onClick={() => { navigate('/admin'); onClose(); }}
                className="w-full justify-start gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-3 py-2 h-9"
              >
                <Crown className="size-4 shrink-0" />
                <span>Painel Admin</span>
              </Button>
            </div>
          )}

          {sections.map((section, idx) => (
            <div key={section.label ?? `section-${idx}`} className={cn(idx > 0 && 'mt-4')}>
              {section.label && (
                <div className="px-3 pb-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {section.label}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 w-full text-sm font-medium text-left',
                        'rounded-lg px-3 py-2 h-9 transition-colors duration-150',
                        isActive
                          ? 'bg-primary/15 text-foreground hover:bg-primary/20 dark:bg-primary/25 dark:text-primary-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'size-[18px] shrink-0 transition-colors',
                          isActive
                            ? 'text-primary dark:text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                        )}
                      />
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge === 'docs' && docCount > 0 && (
                        <span className="text-[10px] font-semibold bg-sidebar-accent/80 text-muted-foreground rounded-md px-1.5 py-0.5 min-w-[20px] text-center">
                          {docCount}
                        </span>
                      )}
                      {item.badge === 'sinistros' && sinistrosCount > 0 && (
                        <span className="text-[10px] font-semibold bg-destructive text-destructive-foreground rounded-md px-1.5 py-0.5 min-w-[20px] text-center">
                          {sinistrosCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ===== Footer: Avatar + nome + role + Sair ===== */}
        <div className="border-t border-sidebar-border p-2 gap-1 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {userRole}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>

          <button
            onClick={() => { logout(); onClose(); }}
            className={cn(
              'flex items-center gap-2.5 text-sm w-full font-medium',
              'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
              'transition-colors duration-150 rounded-lg px-3 py-2 h-9'
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            <span className="truncate">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
