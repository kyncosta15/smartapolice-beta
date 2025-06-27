
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Clock, AlertTriangle, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InstallmentsSummaryCardsProps {
  totalInstallments: number;
  totalValue: number;
  upcomingInstallments: number;
  totalUpcoming: number;
  overdueInstallments: number;
  totalOverdue: number;
  paidInstallments: number;
  totalPaid: number;
}

export function InstallmentsSummaryCards({
  totalInstallments,
  totalValue,
  upcomingInstallments,
  totalUpcoming,
  overdueInstallments,
  totalOverdue,
  paidInstallments,
  totalPaid
}: InstallmentsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Parcelas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInstallments}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalValue)} valor total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximas Parcelas</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{upcomingInstallments}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalUpcoming)} nos próximos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Parcelas Vencidas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueInstallments}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalOverdue)} em atraso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Parcelas Pagas</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{paidInstallments}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalPaid)} quitadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
