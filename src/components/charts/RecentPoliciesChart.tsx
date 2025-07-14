
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import { PolicyData } from './chartData';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecentPoliciesChartProps {
  policies: PolicyData[];
}

export const RecentPoliciesChart = ({ policies }: RecentPoliciesChartProps) => {
  const isMobile = useIsMobile();

  // Filtrar apólices dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPolicies = policies
    .filter(policy => {
      if (!policy.extractedAt) return false;
      const extractedDate = new Date(policy.extractedAt);
      return extractedDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime())
    .slice(0, 15); // Mostrar mais apólices para o PDF

  const formatCurrency = (value: number) => {
    // SEMPRE mostrar valor completo com casas decimais no mobile e desktop
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (endDate: string) => {
    const today = new Date();
    const expiration = new Date(endDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationBadge = (endDate: string) => {
    const days = getDaysUntilExpiration(endDate);
    
    if (days < 0) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Vencendo</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-700">Vigente</Badge>;
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileText className="h-5 w-5 text-blue-600" />
          Novas Apólices (Últimos 30 dias)
        </CardTitle>
        <p className="text-sm text-gray-600">
          {recentPolicies.length} apólices inseridas recentemente
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {recentPolicies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-center text-sm">
              Nenhuma apólice foi inserida nos últimos 30 dias
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPolicies.map((policy, index) => (
              <Card key={policy.id || index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Nome da Apólice */}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {policy.name || `Apólice ${policy.policyNumber || 'S/N'}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {policy.insurer || 'Seguradora não informada'}
                      </p>
                    </div>

                    {/* Informações principais */}
                    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4 md:gap-6'}`}>
                      {/* Data de Inserção - ÍCONE ALTERADO */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Inserida</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(policy.extractedAt)}
                        </p>
                      </div>

                      {/* Valor - ÍCONE ALTERADO */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Valor</span>
                        </div>
                        <p className={`text-sm font-medium text-green-600 ${isMobile ? 'break-words' : ''}`}>
                          {formatCurrency(policy.monthlyAmount || policy.premium || 0)}
                        </p>
                      </div>

                      {/* Data de Vencimento - ÍCONE ALTERADO */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Vencimento</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {policy.endDate ? formatDate(policy.endDate) : 'N/A'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-xs text-gray-500">Status</span>
                        </div>
                        {policy.endDate ? getExpirationBadge(policy.endDate) : (
                          <Badge variant="secondary">Sem data</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};
