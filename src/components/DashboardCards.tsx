import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { useCurrentMonthInstallments } from '@/hooks/useCurrentMonthInstallments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/currencyFormatter';

interface DashboardCardsProps {
  dashboardStats: {
    totalPolicies: number;
    expiringPolicies: number;
    duingNext30Days: number;
    duingNext60Days: number;
    totalMonthlyCost: number;
    totalInsuredValue: number;
    renovadas?: number;
    naoRenovadas?: number;
  };
  isLoading?: boolean;
  onSectionChange?: (section: string) => void;
}

export function DashboardCards({ dashboardStats, isLoading = false, onSectionChange }: DashboardCardsProps) {
  const [expiringPeriod, setExpiringPeriod] = useState<30 | 60>(30);
  
  // Hook para buscar parcelas do mês atual
  const { data: currentMonthData, isLoading: isLoadingInstallments } = useCurrentMonthInstallments();
  
  // Sempre usar valores calculados a partir das parcelas (evita "média")
  const valorMensalReal = currentMonthData.totalMesAtual;
  const valorAnualReal = currentMonthData.totalAnualReal;

  const formatDatePtBrSafe = (isoDate?: string) => {
    if (!isoDate) return '';
    const d = String(isoDate).slice(0, 10);
    const [y, m, day] = d.split('-');
    if (!y || !m || !day) return d;
    return `${day}/${m}/${y}`;
  };
  
  // Formatar mês vigente para exibição
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  
  // Loading skeleton component
  const CardSkeleton = () => (
    <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-4">
      <CardContent className="p-0">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-muted rounded-full"></div>
            <div className="h-3 w-16 bg-gray-200 dark:bg-muted rounded"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-muted rounded mb-1"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-muted rounded"></div>
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
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      iconColor: 'text-blue-600',
      clickable: true
    },
    {
      id: 'premium',
      title: `Prêmio ${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}`,
      value: formatCurrency(valorMensalReal || 0),
      subtitle: currentMonthData.parcelas.length > 0 
        ? `${currentMonthData.parcelas.length} parcela${currentMonthData.parcelas.length > 1 ? 's' : ''} no mês`
        : (isLoadingInstallments ? 'Carregando parcelas…' : 'Nenhuma parcela no mês'),
      icon: DollarSign,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      iconColor: 'text-emerald-600',
      tooltipData: currentMonthData.parcelas.length > 0 ? currentMonthData.parcelas : null
    },
    {
      id: 'coverage',
      title: 'Custo anual',
      value: formatCurrency(valorAnualReal || 0),
      subtitle: 'Soma das parcelas',
      icon: Shield,
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
      iconColor: 'text-purple-600'
    }
  ];

  // Second row cards - gradient background
  const secondRowCards = [
    {
      id: 'renovadas',
      title: 'Vigente',
      value: (dashboardStats.renovadas ?? 0).toString(),
      subtitle: 'Apólices ativas',
      icon: CheckCircle,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      textColor: 'text-white'
    },
    {
      id: 'nao_renovadas',
      title: 'Antigas',
      value: (dashboardStats.naoRenovadas ?? 0).toString(),
      subtitle: 'Apólices antigas',
      icon: AlertTriangle,
      gradient: 'bg-gradient-to-br from-red-500 to-rose-600',
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground tracking-tight">
            Dashboard de Apólices
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1 text-sm">
            Visão executiva das apólices e métricas da empresa
          </p>
        </div>
        
        {/* Removed action buttons - moved to Reports section */}
      </div>

      {/* Cards Grid - Two Rows Layout */}
      
      {/* First Row: Total, Premium, Coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <TooltipProvider>
          {firstRowCards.map((card: any) => {
            const IconComponent = card.icon;
            
            // Para o card de "Prêmio Mensal", adicionar tooltip com parcelas
            if (card.id === 'premium' && card.tooltipData && card.tooltipData.length > 0) {
              return (
                <Tooltip key={card.id}>
                  <TooltipTrigger asChild>
                    <Card 
                      className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-help"
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${card.badgeColor}`}>
                            <IconComponent className="size-3" />
                            {card.title}
                          </span>
                          <Calendar className="size-3 text-emerald-500" />
                        </div>
                        
                        <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground mb-1">
                          {card.value}
                        </div>
                        
                        <div className="text-[12px] text-gray-400 dark:text-muted-foreground">
                          {card.subtitle}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3 bg-popover text-popover-foreground border shadow-lg">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Parcelas do mês:</p>
                      {card.tooltipData.slice(0, 5).map((parcela: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs gap-4">
                          <div className="min-w-0">
                            <div className="truncate max-w-[160px]">
                              {parcela.numero_apolice || 'Apólice'}
                            </div>
                            {parcela.data_vencimento && (
                              <div className="text-[11px] text-muted-foreground">
                                {formatDatePtBrSafe(parcela.data_vencimento)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(parcela.valor)}
                          </span>
                        </div>
                      ))}
                      {card.tooltipData.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{card.tooltipData.length - 5} parcela(s)
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <Card 
                key={card.id} 
                className={`bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-4 shadow-sm transition-all duration-200 ${
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
                  
                  <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground mb-1">
                    {card.value}
                  </div>
                  
                  <div className="text-[12px] text-gray-400 dark:text-muted-foreground">
                    {card.subtitle}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Second Row: Status Cards with Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {secondRowCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card 
              key={card.id} 
              className={`${card.gradient} dark:opacity-90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border-0`}
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
        
        {/* Card Vencendo com seletor 30/60 dias */}
        <Card 
          className="bg-gradient-to-br from-amber-500 to-orange-500 dark:opacity-90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border-0"
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-white/20 text-white">
                <Clock className="size-3" />
                Vencendo {expiringPeriod}d
              </span>
              
              {/* Seletor 30/60 dias */}
              <div className="flex gap-1 bg-white/10 rounded-full p-0.5">
                <button
                  onClick={() => setExpiringPeriod(30)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                    expiringPeriod === 30 
                      ? 'bg-white text-orange-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  30d
                </button>
                <button
                  onClick={() => setExpiringPeriod(60)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                    expiringPeriod === 60 
                      ? 'bg-white text-orange-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  60d
                </button>
              </div>
            </div>
            
            <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-white">
              {expiringPeriod === 30 
                ? dashboardStats.duingNext30Days 
                : dashboardStats.duingNext60Days}
            </div>
            
            <div className="text-[12px] text-white opacity-80">
              Próximos {expiringPeriod} dias
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}