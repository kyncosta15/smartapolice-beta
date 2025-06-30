
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ChartsSection } from '@/components/ChartsSection';

interface DynamicDashboardProps {
  policies: any[];
}

export function DynamicDashboard({ policies }: DynamicDashboardProps) {
  const { dashboardData } = useDashboardData(policies);

  const stats = [
    {
      title: 'Total de Apólices',
      value: dashboardData.totalPolicies.toString(),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Custo Mensal Total',
      value: formatCurrency(dashboardData.totalMonthlyCost),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Valor Segurado',
      value: formatCurrency(dashboardData.totalInsuredValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Vencendo em 30 Dias',
      value: dashboardData.expiringPolicies.toString(),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Gráficos */}
      <ChartsSection policies={policies} />
    </div>
  );
}
