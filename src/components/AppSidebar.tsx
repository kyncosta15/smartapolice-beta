import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  LogOut
} from "lucide-react";
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
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { open } = useSidebar();

  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'users', title: 'Vidas e Beneficiários', icon: Users2 },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex border-r border-border/50">
      {/* Header */}
      <SidebarHeader className="border-b border-border/30 bg-gradient-to-b from-background to-muted/10">
        <div className="flex items-center justify-center p-4">
          {open ? (
            <SmartApóliceLogo size="sm" showText={true} />
          ) : (
            <SmartApóliceLogo size="sm" showText={false} />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-1">
          {navigation.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onSectionChange(item.id)}
                isActive={activeSection === item.id}
                tooltip={item.title}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm w-full",
                  "transition-all duration-200 ease-out font-medium relative overflow-hidden",
                  "text-muted-foreground hover:bg-accent/50",
                  "hover:text-[#161616]",
                  "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                  activeSection === item.id && [
                    "bg-gradient-to-r from-primary/15 to-primary/5 text-[#161616] shadow-sm border border-primary/10",
                    "hover:from-primary/20 hover:to-primary/8 hover:text-[#161616]",
                    "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-primary/80 before:rounded-r-full"
                  ]
                )}
              >
                <item.icon className={cn(
                  "size-4 transition-all duration-200 flex-shrink-0",
                  activeSection === item.id 
                    ? "text-[#161616] drop-shadow-sm" 
                    : "text-muted-foreground group-hover:text-[#161616] group-hover:scale-110"
                )} />
                <span className="truncate">{item.title}</span>
                {activeSection === item.id && open && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer - Logout Button */}
      <SidebarFooter className="border-t border-border/30 bg-gradient-to-t from-background to-muted/5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair do sistema"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl w-full",
                "text-muted-foreground hover:text-[#161616] hover:bg-accent/50",
                "transition-all duration-200 ease-out font-medium",
                "hover:scale-[1.01] active:scale-[0.99] hover:shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
              )}
            >
              <LogOut className="size-4 transition-transform duration-200 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}