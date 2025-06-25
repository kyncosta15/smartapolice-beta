
import { useState } from 'react';
import { Bell, Search, Menu, X, LogOut, ChevronDown, PanelLeft, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  policies: any[];
}

export function Navbar({ searchTerm, onSearchChange, notificationCount, policies }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();

  const getRoleLabel = (role: string) => {
    const roles = {
      cliente: 'Cliente',
      administrador: 'Administrador',
      corretora: 'Corretora'
    };
    return roles[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      cliente: 'bg-blue-50 text-blue-600 border-blue-200',
      administrador: 'bg-purple-50 text-purple-600 border-purple-200',
      corretora: 'bg-green-50 text-green-600 border-green-200'
    };
    return colors[role] || 'bg-gray-50 text-gray-600 border-gray-200';
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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
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
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar apólice, CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 h-9 bg-gray-50 border-gray-200 text-sm placeholder-gray-500 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-all"
              />
            </div>
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
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-100">
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
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32 break-words">
                    {user?.name}
                  </p>
                  <Badge className={`text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                    {getRoleLabel(user?.role || '')}
                  </Badge>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900 break-words">{user?.name}</p>
                    <Badge className={`text-xs mt-1 ${getRoleBadgeColor(user?.role || '')}`}>
                      {getRoleLabel(user?.role || '')}
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {isMobileMenuOpen && (
          <div className="pb-4 md:hidden">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar apólice, CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 h-9 bg-gray-50 border-gray-200 text-sm placeholder-gray-500 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
