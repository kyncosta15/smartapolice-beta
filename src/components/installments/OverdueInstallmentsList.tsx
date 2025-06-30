
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface ExtendedInstallment {
  numero: number;
  valor: number;
  data: string;
  status: 'pendente'; // Removido 'paga'
  policyName: string;
  policyType: string;
  insurer: string;
}

interface OverdueInstallmentsListProps {
  overdueInstallments: ExtendedInstallment[];
}

export function OverdueInstallmentsList({ overdueInstallments }: OverdueInstallmentsListProps) {
  if (overdueInstallments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          Parcelas Vencidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overdueInstallments
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 6)
            .map((installment, index) => (
            <div key={`overdue-${index}`} 
                 className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Parcela {installment.numero || 'N/A'}</p>
                <p className="text-xs text-gray-600">
                  {installment.policyName} • {installment.insurer}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">
                  {formatCurrency(installment.valor)}
                </p>
                <p className="text-xs text-gray-600">
                  Venceu em {new Date(installment.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
        {overdueInstallments.length > 6 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            +{overdueInstallments.length - 6} parcelas vencidas adicionais
          </p>
        )}
      </CardContent>
    </Card>
  );
}
