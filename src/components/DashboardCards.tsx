import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Download,
  Mail
} from 'lucide-react';

interface DashboardCardsProps {
  dashboardStats: {
    totalPolicies: number;
    expiringPolicies: number;
    duingNext30Days: number;
    totalMonthlyCost: number;
    totalInsuredValue: number;
  };
}

export function DashboardCards({ dashboardStats }: DashboardCardsProps) {
  
  const cards = [
    {
      id: 'total',
      title: 'Total',
      value: dashboardStats.totalPolicies,
      subtitle: 'Apólices',
      icon: FileText,
      badgeColor: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600'
    },
    {
      id: 'premium',
      title: 'Prêmio Mensal',
      value: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(dashboardStats.totalMonthlyCost || 0),
      subtitle: 'Prêmio Total',
      icon: DollarSign,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'active',
      title: 'Ativas',
      value: dashboardStats.totalPolicies - dashboardStats.expiringPolicies,
      subtitle: 'Em vigor',
      icon: CheckCircle,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'coverage',
      title: 'Valor Segurado',
      value: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(dashboardStats.totalInsuredValue || 0),
      subtitle: 'Cobertura total',
      icon: Shield,
      badgeColor: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-600'
    },
    {
      id: 'expired',
      title: 'Vencidas',
      value: dashboardStats.expiringPolicies,
      subtitle: 'Expiradas',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-50 text-rose-700',
      iconColor: 'text-rose-600'
    },
    {
      id: 'expiring',
      title: 'Vencendo',
      value: dashboardStats.duingNext30Days,
      subtitle: 'Próximos 30 dias',
      icon: Clock,
      badgeColor: 'bg-amber-50 text-amber-700',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard de Apólices
          </h1>
          <p className="text-gray-600 mt-1">
            Visão geral das suas apólices e métricas
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-xl border-gray-200"
            disabled
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar por Email
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card 
              key={card.id} 
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${card.badgeColor}`}>
                      <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {card.title}
                    </span>
                  </div>
                </div>
                
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                
                <div className="text-sm text-gray-500">
                  {card.subtitle}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}