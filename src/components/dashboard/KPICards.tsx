
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface KPICardsProps {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
}

export function KPICards({ totalPolicies, totalMonthlyCost, totalInsuredValue, expiringPolicies }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total de Apólices</CardTitle>
          <FileText className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalPolicies}</div>
          <p className="text-xs opacity-80 mt-1">Apólices ativas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Custo Mensal</CardTitle>
          <DollarSign className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(totalMonthlyCost)}
          </div>
          <p className="text-xs opacity-80 mt-1">Total mensal</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Valor Segurado</CardTitle>
          <Shield className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(totalInsuredValue)}
          </div>
          <p className="text-xs opacity-80 mt-1">Cobertura total</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Vencendo</CardTitle>
          <AlertTriangle className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{expiringPolicies}</div>
          <p className="text-xs opacity-80 mt-1">Próximos 30 dias</p>
        </CardContent>
      </Card>
    </div>
  );
}
