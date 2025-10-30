import { useState } from 'react';
import { LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight, Moon, Sun, Monitor, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useTheme } from '@/components/ThemeProvider';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ onMobileMenuToggle, isMobileMenuOpen = false, onRefresh, isRefreshing = false }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout, user } = useAuth();
  const { profile: userProfile, memberships, activeEmpresa } = useUserProfile();
  const { toast } = useToast();
  const { open } = useSidebar();
  const { theme, setTheme } = useTheme();

  const getRoleLabel = (role: string) => {
    const roles = {
      cliente: 'Cliente',
      administrador: 'Administrador',
      corretora: 'Corretora'
    };
    return roles[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      cliente: 'default',
      administrador: 'destructive',
      corretora: 'secondary'
    };
    return variants[role] || 'outline';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      
      toast({
        title: "Saindo...",
        description: "Fazendo logout da sua conta.",
      });
      
      await logout();
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao sair. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Use profile data with proper fallbacks
  const preferredAvatarUrl = userProfile?.avatar_url || userProfile?.photo_url;
  const preferredDisplayName = userProfile?.display_name || user?.name || 'Usuário';
  
  // Get active empresa name with null check
  const activeEmpresaName = memberships?.find(m => m.empresa_id === activeEmpresa)?.empresa?.nome;

  return (
    <header className="sticky top-0 z-20 bg-background border-b border-border">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left side - Toggle buttons */}
        <div className="flex items-center gap-2">
          {/* Desktop Sidebar Toggle */}
          <SidebarTrigger className="hidden lg:flex items-center justify-center p-2 text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-300 rounded-lg">
            {open ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </SidebarTrigger>
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-300 rounded-lg"
            aria-label="Abrir menu"
          >
            <Menu className={cn(
              "w-5 h-5 transition-all duration-300 ease-out",
              isMobileMenuOpen && "rotate-90 scale-110"
            )} />
          </Button>
        </div>

        {/* Spacer to push user menu to the right */}
        <div className="flex-1"></div>

        {/* Right side - Refresh, Dark Mode Toggle and User Menu */}
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 rounded-xl border-border hover:bg-accent"
              title="Atualizar apólices"
            >
              <RefreshCw className={cn(
                "h-5 w-5 text-muted-foreground",
                isRefreshing && "animate-spin"
              )} />
              <span className="sr-only">Atualizar dados</span>
            </Button>
          )}
          
          {/* Dark mode toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl border-border hover:bg-accent"
              >
                {theme === 'light' && <Sun className="h-5 w-5 text-amber-500" />}
                {theme === 'dark' && <Moon className="h-5 w-5 text-blue-500" />}
                {theme === 'system' && <Monitor className="h-5 w-5 text-muted-foreground" />}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4 text-amber-500" />
                <span>Claro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4 text-blue-500" />
                <span>Escuro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                <span>Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 text-foreground/70 hover:text-foreground hover:bg-accent transition-colors rounded-lg"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage 
                  src={preferredAvatarUrl} 
                  alt="Foto de perfil"
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                  {getInitials(preferredDisplayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {preferredDisplayName || 'Usuário'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <Card className="absolute right-0 mt-2 w-64 bg-card shadow-xl border-border z-[9999] rounded-lg">
                <CardContent className="p-3">
                  <div className="px-3 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={preferredAvatarUrl} 
                          alt="Foto de perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-foreground font-semibold">
                          {getInitials(preferredDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground break-words">
                          {preferredDisplayName || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {memberships?.find(m => m.empresa_id === activeEmpresa)?.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </p>
                        {memberships?.length > 0 && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {memberships?.find(m => m.empresa_id === activeEmpresa)?.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start gap-2 text-sm text-foreground/70 hover:bg-accent transition-colors rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}