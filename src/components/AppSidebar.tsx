import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import smartControlShield from '@/assets/smartcontrol-shield.png';
import {
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'docs' | 'sinistros';
}

interface NavSection {
  label?: string; // Sem label = sem header de seção (ex: Dashboard)
  items: NavItem[];
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user, profile, logout } = useAuth();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { activeEmpresaId } = useTenant();
  const [docCount, setDocCount] = useState<number>(0);
  const [sinistrosCount, setSinistrosCount] = useState<number>(0);
  

  // ===== Counters =====
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
      .channel('doc-count-changes')
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
      let open = 0;
      for (const r of rows) {
        const s = (r.status ?? '').toLowerCase();
        const si = (r.status_indenizacao ?? '').toLowerCase();
        const isClosed = CLOSED_STATUSES.includes(s) || (si && CLOSED_STATUSES.includes(si));
        if (!isClosed && OPEN_STATUSES.includes(s)) open++;
      }
      setSinistrosCount(open);
    };
    fetchSinistrosCount();
    const channel = supabase
      .channel('sinistros-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchSinistrosCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isAdmin = profile?.is_admin === true;

  // ===== Navigation organizada em seções (estilo do print) =====
  const clientSections: NavSection[] = [
    {
      items: [{ id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }],
    },
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
    {
      items: [{ id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard }],
    },
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

  // (busca global removida da sidebar)

  const userName = profile?.full_name || (user as any)?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const userRole = isAdmin ? 'Admin' : (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Usuário');

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex border-r border-sidebar-border">
      {/* ===== Header: Logo SmartControl ===== */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className={cn("flex items-center gap-2.5", !open && "justify-center")}>
          <img
            src="/src/assets/smartcontrol-shield.png"
            alt="SmartControl"
            className="w-9 h-9 object-contain shrink-0"
          />
          {open && (
            <div className="flex items-baseline leading-none">
              <span className="text-lg font-normal text-sidebar-foreground tracking-tight">Smart</span>
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Control</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ===== Navigation ===== */}
      <SidebarContent className="px-2 py-2">
        {/* Botão Painel Admin (só admin) */}
        {isAdmin && (
          <div className={cn("mb-2", open ? "px-1" : "px-0 flex justify-center")}>
            <Button
              onClick={() => navigate('/admin')}
              className={cn(
                "gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
                open ? "w-full justify-start rounded-lg px-3 py-2 h-9" : "rounded-full w-9 h-9 p-0 justify-center"
              )}
            >
              <Crown className="size-4 shrink-0" />
              {open && <span>Painel Admin</span>}
            </Button>
          </div>
        )}

        {sections.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`} className={cn(idx > 0 && "mt-4")}>
            {/* Section label (uppercase) */}
            {section.label && open && (
              <div className="px-3 pb-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.label}
                </span>
              </div>
            )}

            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "group flex items-center gap-2.5 text-sm w-full font-medium",
                        "transition-colors duration-150",
                        open ? "rounded-lg px-3 py-2 h-9" : "rounded-lg w-9 h-9 p-0 justify-center mx-auto",
                        isActive
                          ? "bg-primary/15 text-foreground hover:bg-primary/20 dark:bg-primary/25 dark:text-primary-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        isActive ? "text-primary dark:text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      )} />
                      {open && (
                        <>
                          <span className="truncate flex-1 text-left">{item.title}</span>
                          {/* Badges */}
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
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      {/* ===== Footer: Avatar + nome + role + Sair ===== */}
      <SidebarFooter className="border-t border-sidebar-border p-2 gap-1">
        <div className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-2",
          open ? "" : "justify-center"
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {userInitials}
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {userRole}
              </p>
            </div>
          )}
          {open && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair do sistema"
              className={cn(
                "flex items-center gap-2.5 text-sm w-full font-medium",
                "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                "transition-colors duration-150",
                open ? "rounded-lg px-3 py-2 h-9" : "rounded-lg w-9 h-9 p-0 justify-center mx-auto"
              )}
            >
              <LogOut className="size-[18px] shrink-0" />
              {open && <span className="truncate">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
