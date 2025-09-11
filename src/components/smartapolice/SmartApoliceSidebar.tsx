import { useAuth } from '@/contexts/AuthContext';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Upload,
  FileText,
  CreditCard,
  FolderOpen,
  BarChart3,
  Settings,
  Calculator,
  Car,
  Shield
} from "lucide-react";

interface SmartApoliceSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SmartApoliceSidebar({ activeSection, onSectionChange }: SmartApoliceSidebarProps) {
  const { user } = useAuth();
  const { isMobile, toggleSidebar } = useSidebar();

  const navigationItems = [
    {
      id: 'buscar',
      title: 'Buscar / Importar',
      icon: Search,
      description: 'Pesquisar e importar apólices'
    },
    {
      id: 'detalhes',
      title: 'Detalhes',
      icon: FileText,
      description: 'Visualizar informações completas'
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: CreditCard,
      description: 'Gestão de pagamentos e parcelas'
    },
    {
      id: 'documentos',
      title: 'Documentos',
      icon: FolderOpen,
      description: 'CNH, termos e documentos'
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      icon: BarChart3,
      description: 'Exportar relatórios em PDF'
    },
    {
      id: 'fipe',
      title: 'FIPE & Cálculos',
      icon: Calculator,
      description: 'Valorização e tabela FIPE'
    },
    {
      id: 'veiculos',
      title: 'Veículos',
      icon: Car,
      description: 'Gestão de veículos e emplacamento'
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  const handleNavigation = (sectionId: string) => {
    console.log('🔄 SmartApolice navegando para:', sectionId);
    onSectionChange(sectionId);
    
    // Fechar sidebar no mobile
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

  return (
    <Sidebar className="bg-white border-r">
      <SidebarHeader className="space-y-4 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Smart<span className="text-blue-600">Apólice</span>
            </h1>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
              BETA
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.id)}
                isActive={activeSection === item.id}
                className="w-full justify-start"
                tooltip={item.description}
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
              {user?.name ? getInitials(user.name) : 'SA'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium truncate">
              {user?.name || 'Usuário SmartApolice'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || 'cliente'}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}