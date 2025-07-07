
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

export function WelcomeSection() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const getRoleMessage = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Você tem acesso total ao sistema de gestão de apólices.';
      case 'cliente':
        return 'Gerencie suas apólices de forma inteligente e segura.';
      case 'corretora':
        return 'Administre as apólices dos seus clientes de forma eficiente.';
      default:
        return 'Bem-vindo ao sistema de gestão de apólices.';
    }
  };

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

  return (
    <div className="sticky top-16 z-40 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200 shadow-sm">
      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
          <CardContent className={`${isMobile ? 'p-4' : 'p-5'}`}>
            <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
              <Avatar className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14'} border-2 border-blue-100`}>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-base">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className={`flex items-center ${isMobile ? 'flex-col items-start space-y-1' : 'space-x-3'}`}>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                    Bem-vindo, {user?.name}!
                  </h2>
                  <Badge variant={getRoleBadgeVariant(user?.role || '')} className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {getRoleLabel(user?.role || '')}
                  </Badge>
                </div>
                
                {!isMobile && (
                  <>
                    <Separator className="bg-gradient-to-r from-blue-200 to-purple-200" />
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {getRoleMessage(user?.role || '')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
