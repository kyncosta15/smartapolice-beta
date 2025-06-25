
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InstallmentsDashboardProps {
  policies: ParsedPolicyData[];
}

export function InstallmentsDashboard({ policies }: InstallmentsDashboardProps) {
  // Extrair todas as parcelas de todas as apólices
  const allInstallments = policies.flatMap(policy => 
    (policy.installments || []).map(installment => ({
      ...installment,
      policyName: policy.name,
      policyType: policy.type,
      insurer: policy.insurer
    }))
  );

  // Ordenar por data
  const sortedInstallments = allInstallments.sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  // Próximas parcelas (próximos 30 dias)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const upcomingInstallments = sortedInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate >= today && installmentDate <= thirtyDaysFromNow;
  });

  // Parcelas vencidas
  const overdueInstallments = sortedInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate < today;
  });

  // Total próximas parcelas
  const totalUpcoming = upcomingInstallments.reduce((sum, installment) => sum + installment.valor, 0);
  const totalOverdue = overdueInstallments.reduce((sum, installment) => sum + installment.valor, 0);

  if (policies.length === 0 || allInstallments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma parcela encontrada</h3>
          <p className="text-gray-500">As parcelas aparecerão aqui quando as apólices forem processadas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo das Parcelas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Parcelas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingInstallments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalUpcoming)} nos próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInstallments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalOverdue)} em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parcelas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInstallments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(allInstallments.reduce((sum, inst) => sum + inst.valor, 0))} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Próximas Parcelas */}
      {upcomingInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Próximas Parcelas (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInstallments.slice(0, 5).map((installment, index) => (
                <div key={`${installment.policyName}-${installment.data}-${index}`} 
                     className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{installment.policyName}</p>
                    <p className="text-xs text-gray-600">{installment.insurer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(installment.valor)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(installment.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {upcomingInstallments.length > 5 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                +{upcomingInstallments.length - 5} parcelas adicionais
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Parcelas Vencidas */}
      {overdueInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Parcelas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInstallments.slice(0, 5).map((installment, index) => (
                <div key={`overdue-${installment.policyName}-${installment.data}-${index}`} 
                     className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{installment.policyName}</p>
                    <p className="text-xs text-gray-600">{installment.insurer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {formatCurrency(installment.valor)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Venceu em {new Date(installment.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="destructive" className="ml-2">
                    Vencida
                  </Badge>
                </div>
              ))}
            </div>
            {overdueInstallments.length > 5 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                +{overdueInstallments.length - 5} parcelas vencidas adicionais
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
