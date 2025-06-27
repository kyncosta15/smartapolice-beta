
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, AlertTriangle, FileText } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InstallmentsDashboardProps {
  policies: ParsedPolicyData[];
}

export function InstallmentsDashboard({ policies }: InstallmentsDashboardProps) {
  // Verificar se há apólices com dados de parcelas detalhadas
  const policiesWithInstallments = policies.filter(policy => 
    Array.isArray(policy.installments) && policy.installments.length > 0
  );

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma apólice encontrada</h3>
          <p className="text-gray-500">As apólices aparecerão aqui quando forem processadas</p>
        </CardContent>
      </Card>
    );
  }

  if (policiesWithInstallments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dados de parcelas não disponíveis</h3>
          <p className="text-gray-500">
            As informações detalhadas de parcelas aparecerão aqui quando disponíveis nos PDFs processados
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totalInstallments = policiesWithInstallments.reduce((sum, policy) => 
    sum + policy.installments.length, 0
  );

  const totalValue = policiesWithInstallments.reduce((sum, policy) => 
    sum + policy.installments.reduce((policySum, installment) => 
      policySum + installment.valor, 0
    ), 0
  );

  // Próximas parcelas (próximos 30 dias)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const allInstallments = policiesWithInstallments.flatMap(policy => 
    policy.installments.map(installment => ({
      ...installment, // Spread all installment properties including status and numero
      policyName: policy.name,
      policyType: policy.type,
      insurer: policy.insurer
    }))
  );

  const upcomingInstallments = allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate >= today && installmentDate <= thirtyDaysFromNow;
  });

  const overdueInstallments = allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate < today && (installment.status === 'pendente' || !installment.status);
  });

  const paidInstallments = allInstallments.filter(installment => 
    installment.status === 'paga'
  );

  const totalUpcoming = upcomingInstallments.reduce((sum, installment) => sum + installment.valor, 0);
  const totalOverdue = overdueInstallments.reduce((sum, installment) => sum + installment.valor, 0);

  return (
    <div className="space-y-6">
      {/* Resumo Geral das Parcelas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parcelas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstallments}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalValue)} valor total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Parcelas</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingInstallments.length}</div>
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
            <CardTitle className="text-sm font-medium">Parcelas Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInstallments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(paidInstallments.reduce((sum, inst) => sum + inst.valor, 0))} quitadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Apólice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policiesWithInstallments.map((policy, index) => (
          <Card key={policy.id || index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{policy.name}</span>
                <Badge variant="outline">{policy.insurer}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {policy.installments.length} parcelas • Valor total: {formatCurrency(
                  policy.installments.reduce((sum, inst) => sum + inst.valor, 0)
                )}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {policy.installments.map((installment, instIndex) => {
                  const installmentDate = new Date(installment.data);
                  const isOverdue = installmentDate < today && (installment.status === 'pendente' || !installment.status);
                  const isUpcoming = installmentDate >= today && installmentDate <= thirtyDaysFromNow;
                  
                  return (
                    <div 
                      key={`${policy.id}-${instIndex}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isOverdue ? 'bg-red-50 border-red-200' :
                        isUpcoming ? 'bg-blue-50 border-blue-200' :
                        installment.status === 'paga' ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium">
                          Parcela {installment.numero || (instIndex + 1)}
                        </div>
                        <Badge 
                          variant={
                            installment.status === 'paga' ? 'default' :
                            isOverdue ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {installment.status === 'paga' ? 'Paga' :
                           isOverdue ? 'Vencida' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {formatCurrency(installment.valor)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {installmentDate.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Próximas Parcelas */}
      {upcomingInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Próximas Parcelas (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInstallments
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .slice(0, 8)
                .map((installment, index) => (
                <div key={`upcoming-${index}`} 
                     className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{installment.policyName}</p>
                    <p className="text-xs text-gray-600">
                      {installment.insurer} • Parcela {installment.numero || 'N/A'}
                    </p>
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
            {upcomingInstallments.length > 8 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                +{upcomingInstallments.length - 8} parcelas adicionais
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
