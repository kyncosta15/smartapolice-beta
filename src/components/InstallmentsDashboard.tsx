
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';

interface InstallmentsDashboardProps {
  policies: any[];
}

export function InstallmentsDashboard({ policies }: InstallmentsDashboardProps) {
  // Calcula informações das parcelas para cada apólice
  const getInstallmentInfo = (policy: any) => {
    const installments = policy.installments || 12;
    const totalValue = policy.premium || 0;
    const installmentValue = totalValue / installments;
    
    return {
      installments,
      installmentValue,
      totalValue
    };
  };

  // Agrupa estatísticas gerais
  const getOverallStats = () => {
    if (policies.length === 0) return { totalPolicies: 0, totalInstallments: 0, totalMonthlyValue: 0 };
    
    const totalPolicies = policies.length;
    const totalInstallments = policies.reduce((sum, policy) => sum + (policy.installments || 12), 0);
    const totalMonthlyValue = policies.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    
    return {
      totalPolicies,
      totalInstallments,
      totalMonthlyValue
    };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Apólices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPolicies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Parcelas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInstallments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Mensal Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {stats.totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Apólice */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Detalhes de Parcelas por Apólice
          </CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma apólice encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Faça upload de PDFs para ver as informações das parcelas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => {
                const installmentInfo = getInstallmentInfo(policy);
                return (
                  <div key={policy.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{policy.name}</h4>
                        <p className="text-sm text-gray-500">{policy.insurer} • {policy.policyNumber}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {policy.type === 'auto' ? 'Auto' : 
                             policy.type === 'vida' ? 'Vida' : 
                             policy.type === 'saude' ? 'Saúde' : 
                             policy.type === 'patrimonial' ? 'Patrimonial' : 'Outros'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Parcelas</p>
                          <p className="font-semibold text-gray-900">{installmentInfo.installments}x</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Valor da Parcela</p>
                          <p className="font-semibold text-green-600">
                            R$ {installmentInfo.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-semibold text-blue-600">
                            R$ {installmentInfo.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
