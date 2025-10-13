import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock
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
  onSectionChange?: (section: string) => void;
}

export function DashboardCards({ dashboardStats, isLoading = false, onSectionChange }: DashboardCardsProps) {
  
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

  // First row cards - white background
  const firstRowCards = [
    {
      id: 'total',
      title: 'Total de Apólices',
      value: dashboardStats.totalPolicies.toString(),
      subtitle: 'Apólices gerenciadas',
      icon: FileText,
      badgeColor: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
      clickable: true
    },
    {
      id: 'premium',
      title: 'Custo anual',
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
    }
  ];

  // Second row cards - gradient background
  const secondRowCards = [
    {
      id: 'active',
      title: 'Apólices Ativas',
      value: Math.max(0, dashboardStats.totalPolicies - dashboardStats.expiringPolicies).toString(),
      subtitle: 'Em vigor atualmente',
      icon: CheckCircle,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'expired',
      title: 'Vencidas',
      value: dashboardStats.expiringPolicies.toString(),
      subtitle: 'Necessitam renovação',
      icon: AlertTriangle,
      gradient: 'bg-gradient-to-br from-rose-500 to-rose-600',
      textColor: 'text-white'
    },
    {
      id: 'expiring',
      title: 'Vencendo 30d',
      value: dashboardStats.duingNext30Days.toString(),
      subtitle: 'Próximos 30 dias',
      icon: Clock,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      textColor: 'text-white'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* First row skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        {/* Second row skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
        
        {/* Removed action buttons - moved to Reports section */}
      </div>

      {/* Cards Grid - Two Rows Layout */}
      
      {/* First Row: Total, Premium, Coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {firstRowCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card 
              key={card.id} 
              className={`bg-white border border-gray-200 rounded-2xl p-4 shadow-sm transition-all duration-200 ${
                card.clickable ? 'hover:shadow-md cursor-pointer hover:scale-[1.02]' : 'hover:shadow-md'
              }`}
              onClick={() => card.clickable && onSectionChange?.('policies')}
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

      {/* Second Row: Status Cards with Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {secondRowCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card 
              key={card.id} 
              className={`${card.gradient} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border-0`}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-white/20 text-white">
                    <IconComponent className="size-3" />
                    {card.title}
                  </span>
                </div>
                
                <div className={`text-2xl md:text-3xl font-bold tracking-tight mb-1 ${card.textColor}`}>
                  {card.value}
                </div>
                
                <div className={`text-[12px] ${card.textColor} opacity-80`}>
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