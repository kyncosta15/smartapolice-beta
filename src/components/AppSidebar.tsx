
import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
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
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';

interface NavItemProps {
  title: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  section: 'home' | 'dashboard' | 'policies' | 'upload' | 'users' | 'settings';
  onSectionChange: (section: string) => void;
  active: boolean;
}

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

const NavItem: React.FC<NavItemProps> = ({
  title,
  icon: Icon,
  section,
  active,
  onSectionChange
}) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={() => {
          onSectionChange(section);
          setOpenMobile(false);
        }}
        className="w-full justify-start"
      >
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    section: "dashboard" as const,
  },
  {
    title: "Minhas Apólices",
    icon: FileText,
    section: "policies" as const,
  },
  {
    title: "Upload",
    icon: Upload,
    section: "upload" as const,
  },
  {
    title: "Contatos",
    icon: Users,
    section: "users" as const,
  },
  {
    title: "Configurações",
    icon: Settings,
    section: "settings" as const,
  },
];

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <SmartApóliceLogo 
            size={isCollapsed ? 'sm' : 'md'} 
            showText={!isCollapsed}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
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
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TC</span>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium">Thiago Costa</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
