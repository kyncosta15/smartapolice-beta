import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardCards } from '@/components/DashboardCards';
import { DynamicDashboard } from '@/components/DynamicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, FileText, Upload } from 'lucide-react';

export function ClientDashboard() {
  const { user } = useAuth();

  // Basic stats for client view
  const basicStats = {
    totalPolicies: 0,
    expiringPolicies: 0,
    duingNext30Days: 0,
    totalMonthlyCost: 0,
    totalInsuredValue: 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Bem-vindo, {user?.name || 'Cliente'}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta é sua central de apólices. Aqui você pode visualizar e gerenciar suas apólices de seguro.
          </p>
        </CardContent>
      </Card>

      {/* Dashboard Cards - simplified for client */}
      <DashboardCards 
        dashboardStats={basicStats}
        isLoading={false}
        onSectionChange={() => {}} 
      />

      {/* Quick Actions for Clients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Minhas Apólices</h3>
            <p className="text-sm text-muted-foreground">
              Visualize suas apólices ativas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Upload de Documentos</h3>
            <p className="text-sm text-muted-foreground">
              Faça upload de suas apólices
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <User className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie suas informações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client-specific content without company data access */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tipo de Conta:</span>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            {user?.phone && (
              <div>
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
            {user?.company && (
              <div>
                <span className="text-sm text-muted-foreground">Empresa:</span>
                <p className="font-medium">{user.company}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}