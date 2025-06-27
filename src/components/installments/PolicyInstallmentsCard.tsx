
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
  today.setHours(0, 0, 0, 0);

  // Check if installments is an array
  const installmentsArray = Array.isArray(policy.installments) ? policy.installments : [];

  // Calcular estatísticas das parcelas
  const overdueInstallments = installmentsArray.filter(inst => {
    const installmentDate = new Date(inst.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate < today && inst.status === 'pendente';
  });

  const paidInstallments = installmentsArray.filter(inst => inst.status === 'paga');
  const upcomingInstallments = installmentsArray.filter(inst => {
    const installmentDate = new Date(inst.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate >= today && inst.status === 'pendente';
  });

  // Calcular valor total correto baseado no valor segurado ou prêmio
  const totalValue = policy.totalCoverage || policy.premium || 
    installmentsArray.reduce((sum, inst) => sum + inst.valor, 0);

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
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <span>{installmentsArray.length} parcelas totais</span>
          <span>•</span>
          <span className="text-green-600">{paidInstallments.length} pagas</span>
          <span>•</span>
          <span className="text-blue-600">{upcomingInstallments.length} a vencer</span>
          <span>•</span>
          <span className="text-red-600">{overdueInstallments.length} vencidas</span>
        </div>
        <p className="text-sm text-gray-600">
          Valor total: {formatCurrency(totalValue)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {installmentsArray
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map((installment, instIndex) => {
            const installmentDate = new Date(installment.data);
            installmentDate.setHours(0, 0, 0, 0);
            const isOverdue = installmentDate < today && installment.status === 'pendente';
            const isUpcoming = installmentDate >= today && installment.status === 'pendente';
            const isPaid = installment.status === 'paga';
            
            return (
              <div 
                key={`${policy.id}-${instIndex}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isPaid ? 'bg-green-50 border-green-200' :
                  isOverdue ? 'bg-red-50 border-red-200' :
                  isUpcoming ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">
                    Parcela {installment.numero || (instIndex + 1)}
                  </div>
                  <Badge 
                    variant={
                      isPaid ? 'default' :
                      isOverdue ? 'destructive' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${
                    isPaid ? 'text-green-600' :
                    isOverdue ? 'text-red-600' :
                    isUpcoming ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
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
