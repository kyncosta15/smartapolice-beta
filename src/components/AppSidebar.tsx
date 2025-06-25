import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Building2,
  Calendar,
  Contact2,
  FileText,
  Gauge,
  Home,
  Settings,
  TrendingDown,
  Users2
} from "lucide-react"

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNavigation = (section: string) => {
    onSectionChange(section);
  };

  const adminNavigation = [
    {
      title: "Dashboard",
      icon: Home,
      id: "home",
      description: "Visão geral"
    },
    {
      title: "Apólices",
      icon: FileText,
      id: "policies",
      description: "Gerenciar apólices"
    },
    {
      title: "Clientes",
      icon: Users2,
      id: "clients",
      description: "Gerenciar clientes"
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      id: "reports",
      description: "Análises e métricas"
    },
    {
      title: "Economia Potencial",
      icon: TrendingDown,
      id: "potential-savings",
      description: "Oportunidades de otimização"
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
      description: "Ajustes do sistema"
    }
  ];

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
      title: "Agendamentos",
      icon: Calendar,
      id: "appointments",
      description: "Próximas reuniões"
    },
    {
      title: "Economia Potencial",
      icon: TrendingDown,
      id: "potential-savings",
      description: "Oportunidades de otimização"
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

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;

  return (
    <Sidebar className="bg-white border-r">
      <SidebarHeader className="space-y-2">
        <div className="rounded-md p-2 bg-blue-500/10">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h4 className="font-semibold text-lg text-gray-900">
          {user?.company || 'Nome da Empresa'}
        </h4>
        <p className="text-sm text-gray-500">
          {user?.role === 'administrador' ? 'Administrador' : 'Cliente'}
        </p>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((item) => (
          <SidebarItem
            key={item.id}
            title={item.title}
            icon={item.icon}
            description={item.description}
            active={activeSection === item.id}
            onClick={() => handleNavigation(item.id)}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p className="text-sm text-gray-700">{user?.name || 'Nome do Usuário'}</p>
        <SidebarTrigger className="bg-gray-100 hover:bg-gray-200">
          Sair
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  )
}
