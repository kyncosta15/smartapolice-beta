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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModeToggle } from "@/components/ModeToggle"
import { useSidebar } from '@/components/ui/sidebar';

interface NavItemProps {
  title: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  section: 'home' | 'dashboard' | 'settings' | 'extract' | 'users' | 'projections';
  description: string;
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
  active
}) => {
  const { close } = useSidebar();

  return (
    <Button
      variant="ghost"
      className={`justify-start px-4 ${active ? 'bg-secondary' : 'hover:bg-secondary'}`}
      onClick={() => {
        close();
      }}
    >
      <a href={`#${section}`} onClick={() => { }} className="w-full" >
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="pl-6 text-xs text-muted-foreground">{description}</p>
      </a>
    </Button>
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
  const { isOpen, close } = useSidebar();

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 mr-2">
          Abrir Menu
        </Button>
      </SheetTrigger>
      <SheetContent className="w-64 flex flex-col p-0">
        <ScrollArea className="flex-1">
          <div className="py-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.section}
                {...item}
                active={activeSection === item.section}
                onClick={() => {
                  onSectionChange(item.section);
                }}
              />
            ))}
            <Separator />
          </div>
        </ScrollArea>
        <div className="py-4 px-3 flex items-center justify-between">
          <ModeToggle />
          <p className="text-xs text-muted-foreground">
            LovCode &copy; {new Date().getFullYear()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
