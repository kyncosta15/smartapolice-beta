
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, DollarSign, CreditCard, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/utils/currencyFormatter';

interface DashboardCardsProps {
  stats?: {
    totalPolicies: number;
    monthlyCost: number;
    totalInsured: number;
    activeAlerts: number;
    expiringPolicies: number;
    totalInstallments: number;
    overdueInstallments: number;
    duingNext30Days: number;
    responsibleUser?: string;
  };
}

export const DashboardCards = ({ stats }: DashboardCardsProps) => {
  const isMobile = useIsMobile();
  
  const defaultStats = {
    totalPolicies: 0,
    monthlyCost: 0,
    totalInsured: 0,
    activeAlerts: 0,
    expiringPolicies: 0,
    totalInstallments: 0,
    overdueInstallments: 0,
    duingNext30Days: 0,
    responsibleUser: 'Não definido'
  };

  const currentStats = stats || defaultStats;

  // Função para formatar valores monetários respeitando mobile/desktop
  const formatValue = (value: number, isCurrency = false) => {
    const numValue = isNaN(value) ? 0 : value;
    
    if (isCurrency) {
      if (isMobile) {
        // No mobile, sempre mostrar o valor completo formatado (sem abreviações)
        try {
          return formatCurrency(numValue, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
        } catch (error) {
          console.error('Erro ao formatar moeda:', error);
          return `R$ ${numValue.toFixed(0)}`;
        }
      }
      // No desktop, usar formatação padrão
      try {
        return formatCurrency(numValue);
      } catch (error) {
        console.error('Erro ao formatar moeda:', error);
        return `R$ ${numValue.toFixed(2)}`;
      }
    }
    
    return numValue.toString();
  };

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
      value: formatValue(currentStats.monthlyCost, true),
      icon: DollarSign,
      change: currentStats.monthlyCost > 0 ? 'Ativo' : 'Vazio',
      changeType: currentStats.monthlyCost > 0 ? 'positive' : 'neutral',
      description: 'Gasto total mensal'
    },
    {
      title: 'Valor Segurado',
      value: formatValue(currentStats.totalInsured, true),
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
    },
    {
      title: 'Responsável',
      value: currentStats.responsibleUser || 'Não definido',
      icon: User,
      change: currentStats.responsibleUser ? 'Definido' : 'Não definido',
      changeType: currentStats.responsibleUser ? 'positive' : 'neutral',
      description: 'Responsável pelas apólices'
    }
  ];

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-2 px-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4'} font-sans`}>
      {dashboardData.map((item, index) => (
        <Card key={index} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-full font-sans">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-2' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 leading-tight font-sans`}>
              {item.title}
            </CardTitle>
            <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} text-blue-600 flex-shrink-0`} />
          </CardHeader>
          <CardContent className={`${isMobile ? 'pt-0 px-3 pb-2' : 'pt-0'}`}>
            <div className={`${isMobile ? 'text-sm' : 'text-2xl'} font-bold text-gray-900 mb-1 break-words font-sans`}>
              {item.value}
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  item.changeType === 'positive' ? 'default' : 
                  item.changeType === 'warning' ? 'destructive' : 'secondary'
                }
                className={`${
                  item.changeType === 'positive' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                  item.changeType === 'warning' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-100'
                } ${isMobile ? 'text-xs px-1 py-0.5' : 'text-sm'} font-sans`}
              >
                {item.change}
              </Badge>
              <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 break-words font-sans`}>
                {item.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
