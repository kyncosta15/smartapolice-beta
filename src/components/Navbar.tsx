import { useState } from 'react';
import { Bell, LogOut, ChevronDown, AlertCircle, Calendar, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  policies: any[];
  onMobileMenuToggle: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ searchTerm, onSearchChange, notificationCount, policies, onMobileMenuToggle, isMobileMenuOpen = false }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, profile, logout } = useAuth();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
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

  // Gerar notificações baseadas nas apólices
  const getNotifications = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return policies
      .filter(policy => new Date(policy.endDate) <= thirtyDaysFromNow)
      .map(policy => ({
        id: policy.id,
        type: 'expiring',
        title: 'Apólice próxima do vencimento',
        message: `${policy.name} vence em ${Math.ceil((new Date(policy.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias`,
        date: policy.endDate,
        priority: new Date(policy.endDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium'
      }));
  };

  const notifications = getNotifications();

  // Definir fonte preferida para avatar e nome
  const preferredAvatarUrl = userProfile?.photo_url || profile?.avatar_url || (user as any)?.avatar_url || (user as any)?.avatar;
  const preferredDisplayName = userProfile?.display_name || profile?.full_name || user?.name || '';

  // Se ainda estiver carregando e não tiver dados, mostrar loading
  const isLoadingProfile = profileLoading && !userProfile;

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

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-4 pr-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors rounded-lg"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 hover:bg-red-500 text-white border-0">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <Card className="absolute right-0 mt-2 w-80 bg-white shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[9999] rounded-lg">
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
                    <p className="text-xs text-gray-500">{notifications.length} ativas</p>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <div key={notification.id || index} className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 last:border-b-0 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1 rounded-full ${
                              notification.priority === 'high' ? 'bg-rose-100' : 'bg-amber-100'
                            }`}>
                              {notification.priority === 'high' ? (
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Calendar className="w-3 h-3 text-amber-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 break-words">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 break-words">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* User Menu */}
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