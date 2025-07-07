
import { useState } from 'react';
import { Bell, Menu, LogOut, ChevronDown, PanelLeft, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  policies: any[];
}

export function Navbar({ searchTerm, onSearchChange, notificationCount, policies }: NavbarProps) {
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
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
      console.log('Navbar: Starting logout process...');
      setShowUserMenu(false);
      
      toast({
        title: "Saindo...",
        description: "Fazendo logout da sua conta.",
      });
      
      await logout();
    } catch (error) {
      console.error('Navbar: Logout failed:', error);
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

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Sidebar Toggle and Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle for Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="hidden md:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500 hover:bg-red-500">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <Card className="absolute right-0 mt-2 w-80 bg-white shadow-xl border max-h-96 overflow-y-auto z-50">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      <p className="text-xs text-gray-500">{notifications.length} ativas</p>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhuma notificação</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className={`p-1 rounded-full ${
                                notification.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                              }`}>
                                {notification.priority === 'high' ? (
                                  <AlertCircle className="w-3 h-3 text-red-600" />
                                ) : (
                                  <Calendar className="w-3 h-3 text-yellow-600" />
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
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32 break-words">
                    {user?.name}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>

              {/* User Dropdown */}
              {showUserMenu && (
                <Card className="absolute right-0 mt-2 w-48 bg-white shadow-xl border z-50">
                  <CardContent className="p-1">
                    <div className="px-3 py-2 border-b border-gray-100 sm:hidden">
                      <p className="text-sm font-medium text-gray-900 break-words">{user?.name}</p>
                      <Badge variant={getRoleBadgeVariant(user?.role || '')} className="text-xs mt-1">
                        {getRoleLabel(user?.role || '')}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start space-x-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
