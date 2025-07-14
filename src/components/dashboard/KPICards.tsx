
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, DollarSign, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface KPICardsProps {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  expiredPolicies: number;
  activePolicies: number;
  onTotalClick?: () => void;
}

export function KPICards({
  totalPolicies,
  totalMonthlyCost,
  totalInsuredValue,
  expiringPolicies,
  expiredPolicies,
  activePolicies,
  onTotalClick
}: KPICardsProps) {
  const kpiCards = [
    {
      title: 'Total de Apólices',
      value: totalPolicies.toString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: onTotalClick
    },
    {
      title: 'Custo Mensal Total',
      value: formatCurrency(totalMonthlyCost),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Valor Segurado Total',
      value: formatCurrency(totalInsuredValue),
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Apólices Ativas',
      value: activePolicies.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Vencendo em 30 dias',
      value: expiringPolicies.toString(),
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Apólices Vencidas',
      value: expiredPolicies.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpiCards.map((card, index) => (
        <Card 
          key={index}
          className={`hover:shadow-md transition-shadow ${card.onClick ? 'cursor-pointer' : ''}`}
          onClick={card.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-600">
              {card.title}
            </div>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
