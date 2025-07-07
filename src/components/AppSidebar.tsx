import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SmartApóliceLogo } from "@/components/SmartApoliceLogo"
import {
  BarChart3,
  Contact2,
  FileText,
  Gauge,
  Map,
  Settings,
  Users2,
  Download
} from "lucide-react"

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render to ensure the sidebar updates
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [user?.role]);

  const handleNavigation = (section: string) => {
    console.log('🔄 Navegando para:', section);
    onSectionChange(section);
    // Fechar sidebar no mobile após selecionar uma opção
    if (isMobile) {
      toggleSidebar();
    }
  };

  // Navegação para clientes
  const clientNavigation = [
    {
      title: "Dashboard",
      icon: Gauge,
      id: "home",
      description: "Visão geral"
    },
    {
      title: "Minhas Apólices",
      icon: FileText,
      id: "policies",
      description: "Gerenciar suas apólices"
    },
    {
      title: "Upload",
      icon: FileText,
      id: "upload",
      description: "Importar PDFs"
    },
    {
      title: "Exportar Dashboard",
      icon: Download,
      id: "export",
      description: "Histórico de exportações"
    },
    {
      title: "Contatos",
      icon: Contact2,
      id: "contact",
      description: "Informações de contato"
    },
    {
      title: "Configurações",
      icon: Settings,
      id: "settings",
      description: "Ajustes da conta"
    }
  ];

  // Navegação para administradores
  const adminNavigation = [
    {
      title: "Relatórios",
      icon: BarChart3,
      id: "reports",
      description: "Análises e métricas"
    },
    {
      title: "Regiões",
      icon: Map,
      id: "regions",
      description: "Distribuição regional"
    },
    {
      title: "Upload",
      icon: FileText,
      id: "upload",
      description: "Importar PDFs"
    },
    {
      title: "Exportar Dashboard",
      icon: Download,
      id: "export",
      description: "Histórico de exportações"
    },
    {
      title: "Clientes",
      icon: Users2,
      id: "clients",
      description: "Gerenciar clientes"
    },
    {
      title: "Configurações",
      icon: Settings,
      id: "settings",
      description: "Ajustes do sistema"
    }
  ];

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;
  
  // Debug logs detalhados
  console.log('🔍 AppSidebar Renderização:', {
    timestamp: new Date().toISOString(),
    userRole: user?.role,
    navigationLength: navigation.length,
    navigationItems: navigation.map(item => ({ title: item.title, id: item.id })),
    hasExportItem: navigation.some(item => item.id === 'export'),
    exportItemIndex: navigation.findIndex(item => item.id === 'export'),
    activeSection
  });

  return (
    <Sidebar className="bg-white border-r">
      <SidebarHeader className="space-y-4 p-4">
        <SmartApóliceLogo size="md" showText={true} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item, index) => {
            const isExportItem = item.id === 'export';
            if (isExportItem) {
              console.log('✅ Renderizando "Exportar Dashboard" no índice:', index);
            }
            
            return (
              <SidebarMenuItem key={`${item.id}-${index}`}>
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.id)}
                  isActive={activeSection === item.id}
                  className={`w-full justify-start ${isExportItem ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className={isExportItem ? 'font-medium text-blue-700' : ''}>{item.title}</span>
                  {isExportItem && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-1 rounded">Novo</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-700 font-medium">{user?.name || 'Nome do Usuário'}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}