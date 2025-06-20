
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
    url: "#home",
    icon: Home,
  },
  {
    title: "Importar Apólice",
    url: "#import",
    icon: Upload,
  },
  {
    title: "Financeiro",
    url: "#financial",
    icon: DollarSign,
  },
  {
    title: "Configurações",
    url: "#settings",
    icon: Settings,
  },
  {
    title: "Quem Somos",
    url: "#about",
    icon: Users,
  },
  {
    title: "Contato",
    url: "#contact",
    icon: Phone,
  },
];

export function AppSidebar() {
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SmartApólice
          </h1>
        </div>
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <Badge className={`text-xs mt-1 ${getRoleBadgeColor(user?.role || '')}`}>
            {getRoleLabel(user?.role || '')}
          </Badge>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center space-x-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500">
          © 2024 SmartApólice
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
