import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home,
  FileText, 
  BarChart3, 
  Users2,
  Car,
  Calculator,
  TestTube,
  Settings
} from "lucide-react";
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();

  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Apólices', icon: FileText },
    { id: 'installments', title: 'Prestações', icon: Calculator },
    { id: 'users', title: 'Vidas', icon: Users2 },
    { id: 'vehicles', title: 'Veículos', icon: Car },
    { id: 'reports', title: 'Relatórios', icon: BarChart3 },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Apólices', icon: FileText },
    { id: 'installments', title: 'Prestações', icon: Calculator },
    { id: 'users', title: 'Vidas', icon: Users2 },
    { id: 'vehicles', title: 'Veículos', icon: Car },
    { id: 'claims', title: 'Sinistros', icon: TestTube },
    { id: 'reports', title: 'Relatórios', icon: BarChart3 },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;

  const handleNavigation = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  return (
    <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-gray-200">
        <SmartApóliceLogo size="sm" showText={true} />
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.id)}
                isActive={activeSection === item.id}
                className={cn(
                  "w-full justify-start h-12 text-base rounded-xl mb-1",
                  "hover:bg-gray-50 transition-colors",
                  activeSection === item.id && [
                    "bg-blue-50 text-blue-700 border-l-2 border-blue-600",
                    "font-semibold"
                  ]
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </nav>
    </aside>
  );
}