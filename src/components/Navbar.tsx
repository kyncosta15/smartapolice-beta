
import { useState } from 'react';
import { Bell, Search, Menu, X, LogOut, ChevronDown, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SmartApóliceLogo } from './SmartApoliceLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
}

export function Navbar({ searchTerm, onSearchChange, notificationCount }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Sidebar Toggle, Logo and Mobile Menu */}
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
            
            <SmartApóliceLogo size="md" showText={true} />
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32">
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
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
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
