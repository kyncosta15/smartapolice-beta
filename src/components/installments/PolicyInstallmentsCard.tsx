
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';

interface PolicyInstallmentsCardProps {
  policy: ParsedPolicyData;
  index: number;
}

export function PolicyInstallmentsCard({ policy, index }: PolicyInstallmentsCardProps) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Card key={policy.id || index}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg">{policy.name}</span>
            <span className="text-sm font-normal text-gray-600">{policy.policyNumber}</span>
          </div>
          <Badge variant="outline">{policy.insurer}</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          {policy.installments.length} parcelas • Valor total: {formatCurrency(
            policy.installments.reduce((sum, inst) => sum + inst.valor, 0)
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {policy.installments.map((installment, instIndex) => {
            const installmentDate = new Date(installment.data);
            const isOverdue = installmentDate < today && installment.status === 'pendente';
            const isUpcoming = installmentDate >= today && installmentDate <= thirtyDaysFromNow && installment.status === 'pendente';
            
            return (
              <div 
                key={`${policy.id}-${instIndex}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isOverdue ? 'bg-red-50 border-red-200' :
                  isUpcoming ? 'bg-blue-50 border-blue-200' :
                  installment.status === 'paga' ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">
                    Parcela {installment.numero || (instIndex + 1)}
                  </div>
                  <Badge 
                    variant={
                      installment.status === 'paga' ? 'default' :
                      isOverdue ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {installment.status === 'paga' ? 'Paga' :
                     isOverdue ? 'Vencida' : 'Pendente'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(installment.valor)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {installmentDate.toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
