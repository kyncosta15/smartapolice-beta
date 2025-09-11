
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SmartApóliceLogo } from "@/components/SmartApoliceLogo"
import {
  BarChart3,
  Contact2,
  FileText,
  Gauge,
  Map,
  Settings,
  Users2,
  Car,
  Calculator,
  TestTube
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      title: "Sinistros",
      icon: Calculator,
      id: "sinistros",
      description: "Abertura e acompanhamento de sinistros"
    },
    {
      title: "Veículos",
      icon: Car,
      id: "veiculos",
      description: "Gestão de veículos e documentos"
    },
    {
      title: "Upload",
      icon: FileText,
      id: "upload",
      description: "Importar PDFs"
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
      title: "Sinistros",
      icon: Calculator,
      id: "sinistros",
      description: "Gestão de sinistros e tickets"
    },
    {
      title: "Regiões",
      icon: Map,
      id: "regions",
      description: "Distribuição regional"
    },
    {
      title: "Veículos & FIPE",
      icon: Car,
      id: "veiculos",
      description: "Gestão de veículos e cálculos FIPE"
    },
    {
      title: "Upload",
      icon: FileText,
      id: "upload",
      description: "Importar PDFs"
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
    },
    {
      title: "Teste N8N",
      icon: TestTube,
      id: "n8n-test",
      description: "Testar dados do N8N"
    }
  ];

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;
  
  return (
    <Sidebar className="bg-white border-r">
      <SidebarHeader className="space-y-4 p-4">
        <SmartApóliceLogo size="md" showText={true} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item, index) => (
            <SidebarMenuItem key={`${item.id}-${index}`}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.id)}
                isActive={activeSection === item.id}
                className="w-full justify-start"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-700 font-medium">{user?.name || 'Nome do Usuário'}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
