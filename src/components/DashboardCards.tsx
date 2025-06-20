
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, DollarSign } from 'lucide-react';

interface DashboardCardsProps {
  stats?: {
    totalPolicies: number;
    monthlyCost: number;
    totalInsured: number;
    activeAlerts: number;
  };
}

export const DashboardCards = ({ stats }: DashboardCardsProps) => {
  const defaultStats = {
    totalPolicies: 247,
    monthlyCost: 127850,
    totalInsured: 25400000,
    activeAlerts: 7
  };

  const currentStats = stats || defaultStats;

  const dashboardData = [
    {
      title: 'Apólices Ativas',
      value: currentStats.totalPolicies.toString(),
      icon: Shield,
      change: '+12%',
      changeType: 'positive',
      description: 'Total de apólices vigentes'
    },
    {
      title: 'Custo Mensal',
      value: `R$ ${currentStats.monthlyCost.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      change: '-3.2%',
      changeType: 'positive',
      description: 'Gasto total mensal'
    },
    {
      title: 'Valor Segurado',
      value: `R$ ${(currentStats.totalInsured / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      change: '+8.1%',
      changeType: 'positive',
      description: 'Patrimônio total segurado'
    },
    {
      title: 'Seguradoras',
      value: '12',
      icon: Users,
      change: '0',
      changeType: 'neutral',
      description: 'Parceiros ativos'
    },
    {
      title: 'Vencendo (30 dias)',
      value: '18',
      icon: Calendar,
      change: '+5',
      changeType: 'warning',
      description: 'Requerem atenção'
    },
    {
      title: 'Alertas Ativos',
      value: currentStats.activeAlerts.toString(),
      icon: AlertTriangle,
      change: '-2',
      changeType: 'positive',
      description: 'Pendências importantes'
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
