
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface ExtendedInstallment {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
  policyName: string;
  policyType: string;
  insurer: string;
}

interface UpcomingInstallmentsListProps {
  upcomingInstallments: ExtendedInstallment[];
}

export function UpcomingInstallmentsList({ upcomingInstallments }: UpcomingInstallmentsListProps) {
  if (upcomingInstallments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-500" />
          Próximas Parcelas (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingInstallments
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 8)
            .map((installment, index) => (
            <div key={`upcoming-${index}`} 
                 className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Parcela {installment.numero || 'N/A'}</p>
                <p className="text-xs text-gray-600">
                  {installment.policyName} • {installment.insurer}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">
                  {formatCurrency(installment.valor)}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(installment.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
        {upcomingInstallments.length > 8 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            +{upcomingInstallments.length - 8} parcelas adicionais
          </p>
        )}
      </CardContent>
    </Card>
  );
}
