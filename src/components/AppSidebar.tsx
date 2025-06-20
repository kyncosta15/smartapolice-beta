
import { Calendar, Home, FileText, DollarSign, Settings, Users, Phone, Upload, Shield } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';

const navigationItems = [
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
  {
    title: "Quem Somos",
    id: "about",
    icon: Users,
  },
  {
    title: "Contato",
    id: "contact",
    icon: Phone,
  },
];

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      cliente: 'bg-blue-100 text-blue-700',
      administrador: 'bg-purple-100 text-purple-700',
      corretora: 'bg-green-100 text-green-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      cliente: 'Cliente',
      administrador: 'Administrador',
      corretora: 'Corretora'
    };
    return roles[role] || role;
  };

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <SmartApóliceLogo size="md" />
          <span className="text-lg font-bold text-gray-900">SmartApólice</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <Badge className={`text-xs mt-1 border-0 ${getRoleBadgeColor(user?.role || '')}`}>
            {getRoleLabel(user?.role || '')}
          </Badge>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium px-3">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange(item.id)}
                    className={`flex items-center space-x-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
                      activeSection === item.id 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg text-center">
          © 2024 SmartApólice
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
