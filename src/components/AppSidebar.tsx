
import React from 'react';
import {
  Home,
  LayoutDashboard,
  Settings,
  FilePlus,
  Users,
  TrendingUp
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface NavItemProps {
  title: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  section: 'home' | 'dashboard' | 'settings' | 'extract' | 'users' | 'projections';
  description: string;
  onSectionChange: (section: string) => void;
}

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

const NavItem: React.FC<NavItemProps & { active: boolean }> = ({
  title,
  icon: Icon,
  section,
  description,
  active,
  onSectionChange
}) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        onClick={() => {
          onSectionChange(section);
          setOpenMobile(false);
        }}
      >
        <Button variant="ghost" className="w-full justify-start">
          <Icon className="mr-3 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </Button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const navigationItems = [
  {
    title: "Início",
    icon: Home,
    section: "home" as const,
    description: "Visão geral e boas vindas"
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    section: "dashboard" as const,
    description: "Análise detalhada das apólices"
  },
  {
    title: "Extrair Apólice",
    icon: FilePlus,
    section: "extract" as const,
    description: "Extrair dados de um novo PDF"
  },
  {
    title: "Usuários",
    icon: Users,
    section: "users" as const,
    description: "Gerenciar usuários e permissões"
  },
  {
    title: "Configurações",
    icon: Settings,
    section: "settings" as const,
    description: "Ajustes e preferências do sistema"
  },
  {
    title: "Projeções",
    icon: TrendingUp,
    section: "projections" as const,
    description: "Projeção anual de custos"
  },
];

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">SmartApólice</h1>
            <p className="text-xs text-muted-foreground">Centralize todas suas apólices</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navigationItems.map((item) => (
            <NavItem
              key={item.section}
              {...item}
              active={activeSection === item.section}
              onSectionChange={onSectionChange}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          LovCode &copy; {new Date().getFullYear()}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
