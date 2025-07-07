
import { useState } from 'react';
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

  const handleNavigation = (section: string) => {
    onSectionChange(section);
    // Fechar sidebar no mobile após selecionar uma opção
    if (isMobile) {
      toggleSidebar();
    }
  };


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

  // Adicionar também para administradores
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

  return (
    <Sidebar className="bg-white border-r">
      <SidebarHeader className="space-y-4 p-4">
        <SmartApóliceLogo size="md" showText={true} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.id}>
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
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-700 font-medium">{user?.name || 'Nome do Usuário'}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
