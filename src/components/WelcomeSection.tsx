
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function WelcomeSection() {
  const { user } = useAuth();

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

  return (
    <div className="sticky top-16 z-40 bg-gray-50 border-b border-gray-200 shadow-sm">
      <div className="p-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bem-vindo, {user?.name}!
                </h2>
                <Separator className="my-3" />
                <p className="text-gray-600 text-sm">
                  {getRoleMessage(user?.role || '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
