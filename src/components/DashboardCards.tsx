
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, DollarSign, CreditCard } from 'lucide-react';

interface DashboardCardsProps {
  stats?: {
    totalPolicies: number;
    monthlyCost: number;
    totalInsured: number;
    activeAlerts: number;
    expiringPolicies: number;
    totalInstallments: number;
    overdueInstallments: number; // Nova propriedade para parcelas vencidas
    duingNext30Days: number; // Nova propriedade para parcelas vencendo nos próximos 30 dias
  };
}

export const DashboardCards = ({ stats }: DashboardCardsProps) => {
  const defaultStats = {
    totalPolicies: 0,
    monthlyCost: 0,
    totalInsured: 0,
    activeAlerts: 0,
    expiringPolicies: 0,
    totalInstallments: 0,
    overdueInstallments: 0,
    duingNext30Days: 0
  };

  const currentStats = stats || defaultStats;

  const dashboardData = [
    {
      title: 'Apólices Ativas',
      value: currentStats.totalPolicies.toString(),
      icon: Shield,
      change: currentStats.totalPolicies > 0 ? '+' + currentStats.totalPolicies : '0',
      changeType: 'positive',
      description: 'Total de apólices vigentes'
    },
    {
      title: 'Custo Mensal Total',
      value: `R$ ${currentStats.monthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: currentStats.monthlyCost > 0 ? 'Ativo' : 'Vazio',
      changeType: currentStats.monthlyCost > 0 ? 'positive' : 'neutral',
      description: 'Gasto total mensal'
    },
    {
      title: 'Valor Segurado',
      value: currentStats.totalInsured > 1000000 
        ? `R$ ${(currentStats.totalInsured / 1000000).toFixed(1)}M`
        : `R$ ${currentStats.totalInsured.toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      change: currentStats.totalInsured > 0 ? 'Protegido' : 'Sem dados',
      changeType: currentStats.totalInsured > 0 ? 'positive' : 'neutral',
      description: 'Patrimônio total segurado'
    },
    {
      title: 'Total de Parcelas',
      value: currentStats.totalInstallments.toString(),
      icon: CreditCard,
      change: currentStats.totalInstallments > 0 ? `${currentStats.totalInstallments} parcelas` : 'Nenhuma',
      changeType: currentStats.totalInstallments > 0 ? 'positive' : 'neutral',
      description: 'Parcelas em todas as apólices'
    },
    {
      title: 'Vencendo (30 dias)',
      value: currentStats.duingNext30Days.toString(),
      icon: Calendar,
      change: currentStats.duingNext30Days > 0 ? 'Próximos 30 dias' : 'Nenhuma',
      changeType: currentStats.duingNext30Days > 0 ? 'warning' : 'positive',
      description: 'Parcelas a vencer'
    },
    {
      title: 'Parcelas Vencidas',
      value: currentStats.overdueInstallments.toString(),
      icon: AlertTriangle,
      change: currentStats.overdueInstallments > 0 ? 'Em atraso' : 'Em dia',
      changeType: currentStats.overdueInstallments > 0 ? 'warning' : 'positive',
      description: 'Requerem atenção'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {dashboardData.map((item, index) => (
        <Card key={index} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {item.title}
            </CardTitle>
            <item.icon className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {item.value}
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  item.changeType === 'positive' ? 'default' : 
                  item.changeType === 'warning' ? 'destructive' : 'secondary'
                }
                className={
                  item.changeType === 'positive' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                  item.changeType === 'warning' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-100'
                }
              >
                {item.change}
              </Badge>
              <span className="text-xs text-gray-500">
                {item.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
