import { useState } from 'react';
import { LogOut, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ onMobileMenuToggle, isMobileMenuOpen = false }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, logout } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const { toast } = useToast();

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

  // Definir fonte preferida para avatar e nome
  const preferredAvatarUrl = userProfile?.photo_url || profile?.avatar_url || (user as any)?.avatar_url || (user as any)?.avatar;
  const preferredDisplayName = userProfile?.display_name || profile?.full_name || user?.name || '';

  return (
    <header className="sticky top-0 z-20 bg-slate-800 border-b border-slate-700">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left side - Mobile Menu Toggle */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 rounded-lg"
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

        {/* Right side - User Menu */}
        <div className="flex items-center">
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors rounded-lg"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <Avatar className="h-8 w-8 ring-2 ring-slate-600">
                <AvatarImage 
                  src={preferredAvatarUrl} 
                  alt="Foto de perfil"
                  className="object-cover"
                />
                <AvatarFallback className="bg-slate-600 text-white font-semibold text-sm">
                  {getInitials(preferredDisplayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">
                  {preferredDisplayName || 'Usuário'}
                </p>
                <p className="text-xs text-slate-400">
                  {getRoleLabel((profile?.role || user?.role) || '')}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <Card className="absolute right-0 mt-2 w-64 bg-white shadow-xl border border-gray-200 z-[9999] rounded-lg">
                <CardContent className="p-3">
                  <div className="px-3 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={preferredAvatarUrl} 
                          alt="Foto de perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-600 text-white font-semibold">
                          {getInitials(preferredDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {preferredDisplayName || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profile?.email || user?.email}
                        </p>
                        <Badge variant={getRoleBadgeVariant((profile?.role || user?.role) || '')} className="text-xs mt-1">
                          {getRoleLabel((profile?.role || user?.role) || '')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start gap-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors rounded-lg"
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