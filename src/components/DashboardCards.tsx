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
  Mail,
  TrendingUp
} from 'lucide-react';

interface DashboardCardsProps {
  dashboardStats: {
    totalPolicies: number;
    expiringPolicies: number;
    duingNext30Days: number;
    totalMonthlyCost: number;
    totalInsuredValue: number;
  };
  isLoading?: boolean;
}

export function DashboardCards({ dashboardStats, isLoading = false }: DashboardCardsProps) {
  
  // Loading skeleton component
  const CardSkeleton = () => (
    <Card className="bg-white border border-gray-200 rounded-2xl p-4">
      <CardContent className="p-0">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  const cards = [
    {
      id: 'total',
      title: 'Total de Apólices',
      value: dashboardStats.totalPolicies.toString(),
      subtitle: 'Apólices gerenciadas',
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
      subtitle: 'Valor total dos prêmios',
      icon: DollarSign,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'active',
      title: 'Apólices Ativas',
      value: Math.max(0, dashboardStats.totalPolicies - dashboardStats.expiringPolicies).toString(),
      subtitle: 'Em vigor atualmente',
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
      value: dashboardStats.expiringPolicies.toString(),
      subtitle: 'Necessitam renovação',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-50 text-rose-700',
      iconColor: 'text-rose-600'
    },
    {
      id: 'expiring',
      title: 'Vencendo 30d',
      value: dashboardStats.duingNext30Days.toString(),
      subtitle: 'Próximos 30 dias',
      icon: Clock,
      badgeColor: 'bg-amber-50 text-amber-700',
      iconColor: 'text-amber-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard de Apólices
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Visão executiva das apólices e métricas da empresa
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-xl border-gray-200 shadow-sm"
            disabled
            title="Em breve"
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar por Email
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card 
              key={card.id} 
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${card.badgeColor}`}>
                    <IconComponent className="size-3" />
                    {card.title}
                  </span>
                </div>
                
                <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">
                  {card.value}
                </div>
                
                <div className="text-[12px] text-gray-400">
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