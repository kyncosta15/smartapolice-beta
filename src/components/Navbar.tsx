import { useState, useEffect } from 'react';
import { LogOut, ChevronDown, Menu, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ onMobileMenuToggle, isMobileMenuOpen = false }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { logout, user } = useAuth();
  const { profile: userProfile, memberships, activeEmpresa } = useUserProfile();
  const { toast } = useToast();
  const { open } = useSidebar();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left side - Toggle buttons */}
        <div className="flex items-center gap-2">
          {/* Desktop Sidebar Toggle */}
          <SidebarTrigger className="hidden lg:flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-300 rounded-lg">
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
            className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-300 rounded-lg"
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

        {/* Right side - Dark Mode Toggle and User Menu */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="h-10 w-10 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <Avatar className="h-8 w-8 ring-2 ring-gray-300 dark:ring-gray-600">
                <AvatarImage 
                  src={preferredAvatarUrl} 
                  alt="Foto de perfil"
                  className="object-cover"
                />
                <AvatarFallback className="bg-slate-600 dark:bg-slate-700 text-white font-semibold text-sm">
                  {getInitials(preferredDisplayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {preferredDisplayName || 'Usuário'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <Card className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] rounded-lg">
                <CardContent className="p-3">
                  <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={preferredAvatarUrl} 
                          alt="Foto de perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-600 dark:bg-slate-700 text-white font-semibold">
                          {getInitials(preferredDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                          {preferredDisplayName || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="w-full justify-start gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
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