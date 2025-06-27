
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InstallmentAnalysisCardProps {
  policyName: string;
  overdueCount: number;
  upcomingCount: number;
  nextDueDate: string | null;
  monthlyAmount: number;
}

export function InstallmentAnalysisCard({ 
  policyName, 
  overdueCount, 
  upcomingCount, 
  nextDueDate, 
  monthlyAmount 
}: InstallmentAnalysisCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">{policyName}</span>
          <Badge variant="outline" className="text-xs">
            {formatCurrency(monthlyAmount)}/mês
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parcelas Vencidas */}
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">Vencidas</p>
              <p className="text-lg font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>

          {/* Parcelas a Vencer */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-700">A Vencer</p>
              <p className="text-lg font-bold text-blue-600">{upcomingCount}</p>
            </div>
          </div>

          {/* Próximo Vencimento */}
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Calendar className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700">Próximo</p>
              <p className="text-sm font-bold text-green-600">
                {nextDueDate ? formatDate(nextDueDate) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
