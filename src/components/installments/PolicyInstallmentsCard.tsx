
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
  
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);
  next30Days.setHours(0, 0, 0, 0);

  // Check if installments is an array
  const installmentsArray = Array.isArray(policy.installments) ? policy.installments : [];

  // Calcular estatísticas das parcelas com base na data atual
  const overdueInstallments = installmentsArray.filter(inst => {
    const installmentDate = new Date(inst.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate < today && inst.status === 'pendente';
  });

  const paidInstallments = installmentsArray.filter(inst => inst.status === 'paga');
  
  const dueNext30DaysInstallments = installmentsArray.filter(inst => {
    const installmentDate = new Date(inst.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate >= today && installmentDate <= next30Days && inst.status === 'pendente';
  });

  const futureInstallments = installmentsArray.filter(inst => {
    const installmentDate = new Date(inst.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate > next30Days && inst.status === 'pendente';
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
          <span className="text-orange-600">{dueNext30DaysInstallments.length} a vencer</span>
          <span>•</span>
          <span className="text-red-600">{overdueInstallments.length} vencidas</span>
          <span>•</span>
          <span className="text-blue-600">{futureInstallments.length} futuras</span>
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
            const isDueNext30Days = installmentDate >= today && installmentDate <= next30Days && installment.status === 'pendente';
            const isFuture = installmentDate > next30Days && installment.status === 'pendente';
            const isPaid = installment.status === 'paga';
            
            // Determinar cor e status baseado na lógica atual
            let bgColor = 'bg-gray-50 border-gray-200';
            let textColor = 'text-gray-600';
            let badgeVariant = 'secondary';
            let statusText = 'Pendente';
            
            if (isPaid) {
              bgColor = 'bg-green-50 border-green-200';
              textColor = 'text-green-600';
              badgeVariant = 'default';
              statusText = 'Paga';
            } else if (isOverdue) {
              bgColor = 'bg-red-50 border-red-200';
              textColor = 'text-red-600';
              badgeVariant = 'destructive';
              statusText = 'Vencida';
            } else if (isDueNext30Days) {
              bgColor = 'bg-orange-50 border-orange-200';
              textColor = 'text-orange-600';
              badgeVariant = 'secondary';
              statusText = 'A Vencer';
            } else if (isFuture) {
              bgColor = 'bg-blue-50 border-blue-200';
              textColor = 'text-blue-600';
              badgeVariant = 'secondary';
              statusText = 'Futura';
            }
            
            return (
              <div 
                key={`${policy.id}-${instIndex}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">
                    Parcela {installment.numero || (instIndex + 1)}
                  </div>
                  <Badge 
                    variant={badgeVariant}
                    className={`text-xs ${
                      isDueNext30Days ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''
                    }`}
                  >
                    {statusText}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${textColor}`}>
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
