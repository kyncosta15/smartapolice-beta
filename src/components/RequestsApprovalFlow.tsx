import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RHApprovalDashboard } from './RHApprovalDashboard';
import { AdminApprovalDashboard } from './AdminApprovalDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, AlertTriangle } from 'lucide-react';

export const RequestsApprovalFlow: React.FC = () => {
  const { profile } = useAuth();

  // Determinar qual dashboard mostrar baseado no perfil
  const isRH = profile?.role && ['rh', 'admin', 'administrador', 'gestor_rh'].includes(profile.role);
  const isAdmin = profile?.role && ['admin', 'administrador', 'corretora_admin'].includes(profile.role);

  if (!profile?.role) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground">
              Não foi possível determinar suas permissões. Entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRH && !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o sistema de aprovação de solicitações.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Perfil atual: {profile.role}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se for Admin, mostrar o dashboard administrativo
  if (isAdmin) {
    return <AdminApprovalDashboard />;
  }

  // Caso contrário, mostrar o dashboard RH
  return <RHApprovalDashboard />;
};