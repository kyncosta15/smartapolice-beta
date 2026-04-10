import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  Home,
  FileText, 
  BarChart3, 
  Users2,
  User,
  Car,
  ShieldAlert,
  Settings,
  Upload,
  Mail,
  LogOut,
  CheckSquare,
  Crown,
  Heart,
  FolderOpen,
  Shield,
  ChevronDown,
  Landmark,
  Building2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user, profile, logout } = useAuth();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { activeEmpresaId } = useTenant();
  const [docCount, setDocCount] = useState<number>(0);
  const [sinistrosCount, setSinistrosCount] = useState<number>(0);
  const [sinistrosFinalizados, setSinistrosFinalizados] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      let query = supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);
      if (activeEmpresaId) {
        query = query.eq('account_id', activeEmpresaId);
      }
      const { count } = await query;
      setDocCount(count ?? 0);
    };
    fetchCount();

    const channel = supabase
      .channel('doc-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeEmpresaId]);

  useEffect(() => {
    if (!user) return;
    const fetchSinistrosCount = async () => {
      const { count: openCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'sinistro')
        .not('status', 'eq', 'finalizado')
        .not('status_indenizacao', 'in', '("indenizado","negado")');
      setSinistrosCount(openCount ?? 0);

      const { count: closedCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'sinistro')
        .or('status.eq.finalizado,status_indenizacao.eq.indenizado,status_indenizacao.eq.negado');
      setSinistrosFinalizados(closedCount ?? 0);
    };
    fetchSinistrosCount();

    const channel = supabase
      .channel('sinistros-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchSinistrosCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);
  // Verificar se é admin pelo is_admin flag
  const isAdmin = profile?.is_admin === true;
  const [centralSegurosOpen, setCentralSegurosOpen] = useState(
    activeSection === 'seguro-garantia' || activeSection === 'fianca-locaticia'
  );

  const centralSegurosSubItems = [
    { id: 'seguro-garantia', title: 'Seguro Garantia', icon: Shield },
    { id: 'fianca-locaticia', title: 'Fiança Locatícia', icon: Building2 },
  ];

  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'central-seguros', title: 'Central de Seguros', icon: Landmark, isGroup: true },
    { id: 'documentos', title: 'Documentos', icon: FolderOpen },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'export', title: 'Relatórios', icon: BarChart3 },
    { id: 'settings', title: 'Configurações', icon: Settings },
    { id: 'smartbeneficios', title: 'SmartBenefícios', icon: Heart },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'users', title: 'Vidas e Beneficiários', icon: Users2 },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'central-seguros', title: 'Central de Seguros', icon: Landmark, isGroup: true },
    { id: 'documentos', title: 'Documentos', icon: FolderOpen },
    { id: 'aprovacoes', title: 'Aprovações', icon: CheckSquare },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'export', title: 'Relatórios', icon: BarChart3 },
    { id: 'settings', title: 'Configurações', icon: Settings },
    { id: 'smartbeneficios', title: 'SmartBenefícios', icon: Heart },
  ];

  const navigation = isAdmin 
    ? [] 
    : clientNavigation;

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex border-r border-border/50">
      {/* Header */}
      <SidebarHeader className="border-b border-border/30 bg-gradient-to-b from-sidebar-background to-sidebar-accent/10 dark:from-sidebar-background dark:to-sidebar-accent/5">
        <div className="flex items-center justify-center p-4">
          {open ? (
            <SmartApóliceLogo size="sm" showText={true} />
          ) : (
            <SmartApóliceLogo size="sm" showText={false} />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={cn("px-2", open ? "py-4" : "py-6")}>
        {/* Admin Panel Button */}
        {isAdmin && (
          <div className={cn("mb-4", open ? "px-2" : "px-0")}>
            <Button
              onClick={() => navigate('/admin')}
              className={cn(
                "w-full justify-start gap-3 font-medium",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "text-primary-foreground shadow-lg",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                open ? "rounded-xl px-3 py-2.5" : "rounded-full w-10 h-10 p-0 justify-center"
              )}
            >
              <Crown className="size-4" />
              {open && <span>Painel Admin</span>}
            </Button>
          </div>
        )}
        
        <SidebarMenu className={cn(open ? "space-y-1" : "space-y-4")}>
          {navigation.map((item) => {
            if (item.id === 'central-seguros') {
              const isSubActive = centralSegurosSubItems.some(sub => sub.id === activeSection);
              return (
                <Collapsible
                  key={item.id}
                  open={centralSegurosOpen}
                  onOpenChange={setCentralSegurosOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "group flex items-center gap-3 text-sm w-full",
                          "transition-all duration-200 ease-out font-medium relative overflow-hidden",
                          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                          open ? "rounded-xl px-3 py-2.5" : "rounded-full w-10 h-10 p-0 justify-center",
                          isSubActive && [
                            "bg-gradient-to-r from-primary/15 to-primary/5 text-foreground shadow-sm border border-primary/10",
                          ]
                        )}
                      >
                        <item.icon className={cn(
                          "size-4 transition-all duration-200 flex-shrink-0",
                          isSubActive
                            ? "text-foreground drop-shadow-sm"
                            : "text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110"
                        )} />
                        {open && <span className="truncate">{item.title}</span>}
                        {open && (
                          <ChevronDown className={cn(
                            "ml-auto size-4 text-muted-foreground transition-transform duration-200",
                            centralSegurosOpen && "rotate-180"
                          )} />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {open && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {centralSegurosSubItems.map((sub) => (
                            <SidebarMenuSubItem key={sub.id}>
                              <SidebarMenuSubButton
                                onClick={() => onSectionChange(sub.id)}
                                isActive={activeSection === sub.id}
                                className={cn(
                                  "cursor-pointer transition-all duration-200",
                                  activeSection === sub.id && "text-foreground font-medium bg-primary/10"
                                )}
                              >
                                <sub.icon className="size-3.5 mr-2 flex-shrink-0" />
                                <span>{sub.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onSectionChange(item.id)}
                isActive={activeSection === item.id}
                tooltip={item.title}
                className={cn(
                  "group flex items-center gap-3 text-sm w-full",
                  "transition-all duration-200 ease-out font-medium relative overflow-hidden",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                  open ? "rounded-xl px-3 py-2.5" : "rounded-full w-10 h-10 p-0 justify-center",
                  activeSection === item.id && [
                    "bg-gradient-to-r from-primary/15 to-primary/5 text-foreground shadow-sm border border-primary/10",
                    "hover:from-primary/20 hover:to-primary/8",
                    open && "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-primary/80 before:rounded-r-full"
                  ]
                )}
              >
                <item.icon className={cn(
                  "size-4 transition-all duration-200 flex-shrink-0",
                  activeSection === item.id 
                    ? "text-foreground drop-shadow-sm" 
                    : "text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110"
                )} />
                {open && <span className="truncate">{item.title}</span>}
                {open && item.id === 'documentos' && docCount > 0 && (
                  <span className="ml-auto text-[10px] font-semibold bg-primary/15 text-primary rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {docCount}
                  </span>
                )}
                {open && item.id === 'claims' && sinistrosCount > 0 && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-[10px] font-semibold bg-destructive/15 text-destructive rounded-full px-1.5 py-0.5 min-w-[20px] text-center" title="Em Aberto">
                      {sinistrosCount}
                    </span>
                    {sinistrosFinalizados > 0 && (
                      <span className="text-[10px] font-semibold bg-green-500/15 text-green-600 rounded-full px-1.5 py-0.5 min-w-[20px] text-center" title="Finalizados">
                        {sinistrosFinalizados}
                      </span>
                    )}
                  </div>
                )}
                {activeSection === item.id && open && item.id !== 'documentos' && item.id !== 'claims' && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer - Logout Button */}
      <SidebarFooter className="border-t border-border/30 bg-gradient-to-t from-sidebar-background to-sidebar-accent/10 dark:from-sidebar-background dark:to-sidebar-accent/5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair do sistema"
              className={cn(
                "flex items-center gap-3 text-sm w-full",
                "text-muted-foreground hover:text-accent-foreground hover:bg-accent",
                "transition-all duration-200 ease-out font-medium",
                "hover:scale-[1.01] active:scale-[0.99] hover:shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                // Quando colapsado: circular, caso contrário: rounded-xl
                open ? "rounded-xl px-3 py-2.5" : "rounded-full w-10 h-10 p-0 justify-center"
              )}
            >
              <LogOut className="size-4 transition-transform duration-200 flex-shrink-0" />
              {open && <span className="truncate">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}