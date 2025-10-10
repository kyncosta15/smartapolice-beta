import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Crown, LogOut, CheckCircle, User, Mail } from 'lucide-react';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { useAuth } from '@/contexts/AuthContext';
import adminLogo from '@/assets/admin-sidebar-logo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: 'overview' | 'approvals' | 'profile' | 'emails';
}

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { open } = useSidebar();

  const menuItems = [
    { title: 'Dashboard', url: '/admin', icon: Crown },
    { title: 'Aprovações', url: '/admin/aprovacoes', icon: CheckCircle },
    { title: 'Meu Perfil', url: '/admin/perfil', icon: User },
  ];

  // Adicionar Email Settings apenas para admin@rcaldas.com.br
  if (user?.email === 'admin@rcaldas.com.br') {
    menuItems.push({ title: 'Email Settings', url: '/admin/email-settings', icon: Mail });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className="border-b p-4 h-16 flex items-center justify-center">
        {open ? (
          <SmartApóliceLogo size="md" showText={true} />
        ) : (
          <img 
            src={adminLogo} 
            alt="RCaldas Admin" 
            className="h-12 w-12 object-contain"
          />
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                isActive={isActive(item.url)}
                tooltip={item.title}
                className="h-12 w-full"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-2">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-2 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair"
              className="h-12 w-full text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="ml-2">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = useUserProfile();
  const { logout } = useAuth();

  const initials = profile?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AR';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-16">
            <div className="h-full px-4 md:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hover:bg-accent" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 md:gap-3 h-auto py-2 px-2 md:px-3 hover:bg-accent">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium">{profile?.display_name || 'Admin'}</span>
                      <span className="text-xs text-muted-foreground">Administrador</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
