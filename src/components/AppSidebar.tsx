
import { Calendar, Home, FileText, DollarSign, Settings, Users, Phone, Upload } from 'lucide-react';
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

const navigationItems = [
  {
    title: "Home",
    id: "home",
    icon: Home,
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
      cliente: 'bg-blue-100/80 text-blue-700 backdrop-blur-sm',
      administrador: 'bg-purple-100/80 text-purple-700 backdrop-blur-sm',
      corretora: 'bg-green-100/80 text-green-700 backdrop-blur-sm'
    };
    return colors[role] || 'bg-gray-100/80 text-gray-700 backdrop-blur-sm';
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
    <Sidebar className="bg-white/10 backdrop-blur-xl border-r border-white/20">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            SmartApólice
          </h1>
        </div>
        <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <Badge className={`text-xs mt-1 border-0 ${getRoleBadgeColor(user?.role || '')}`}>
            {getRoleLabel(user?.role || '')}
          </Badge>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange(item.id)}
                    className={`flex items-center space-x-2 hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200 ${
                      activeSection === item.id 
                        ? 'bg-white/20 text-blue-700 shadow-sm' 
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

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 bg-white/5 backdrop-blur-sm p-2 rounded-lg">
          © 2024 SmartApólice
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
