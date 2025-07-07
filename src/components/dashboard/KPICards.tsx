
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Shield, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface KPICardsProps {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  expiredPolicies: number;
  activePolicies: number;
}

export function KPICards({ totalPolicies, totalMonthlyCost, totalInsuredValue, expiringPolicies, expiredPolicies, activePolicies }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total</CardTitle>
          <FileText className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPolicies}</div>
          <p className="text-xs opacity-80 mt-1">Apólices</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Ativas</CardTitle>
          <Shield className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePolicies}</div>
          <p className="text-xs opacity-80 mt-1">Em vigor</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Vencendo</CardTitle>
          <AlertTriangle className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringPolicies}</div>
          <p className="text-xs opacity-80 mt-1">30 dias</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Vencidas</CardTitle>
          <XCircle className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredPolicies}</div>
          <p className="text-xs opacity-80 mt-1">Expiradas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Custo Mensal</CardTitle>
          <DollarSign className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalMonthlyCost)}
          </div>
          <p className="text-xs opacity-80 mt-1">Total</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Valor Segurado</CardTitle>
          <Clock className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalInsuredValue)}
          </div>
          <p className="text-xs opacity-80 mt-1">Cobertura</p>
        </CardContent>
      </Card>
    </div>
  );
}
