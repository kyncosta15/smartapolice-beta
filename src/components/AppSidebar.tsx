
import { Calendar, Home, FileText, DollarSign, Settings, Users, Phone, Upload, UserPlus, Shield } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SmartApóliceLogo } from './SmartApoliceLogo';
import { useAuth } from '@/contexts/AuthContext';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        id: "home",
        icon: Home,
      },
      {
        title: "Minhas Apólices",
        id: "policies",
        icon: FileText,
      },
      {
        title: "Importar Apólice",
        id: "import",
        icon: Upload,
      },
      {
        title: "Financeiro",
        id: "financial",
        icon: DollarSign,
      },
      {
        title: "Configurações",
        id: "settings",
        icon: Settings,
      },
    ];

    // Adicionar itens específicos para administrador
    if (user?.role === 'administrador') {
      baseItems.splice(2, 0, {
        title: "Painel Admin",
        id: "admin",
        icon: Shield,
      });
      baseItems.splice(3, 0, {
        title: "Cadastrar Cliente",
        id: "register-client",
        icon: UserPlus,
      });
    }

    // Adicionar itens gerais no final
    baseItems.push(
      {
        title: "Quem Somos",
        id: "about",
        icon: Users,
      },
      {
        title: "Contato",
        id: "contact",
        icon: Phone,
      }
    );

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className="border-r border-gray-100 bg-white">
      <SidebarHeader className="px-4 py-6 border-b border-gray-50">
        <SmartApóliceLogo size="md" showText={true} />
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
                      activeSection === item.id 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${
                      activeSection === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-gray-50">
        <div className="text-xs text-gray-400 text-center font-medium">
          © 2024 SmartApólice
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
