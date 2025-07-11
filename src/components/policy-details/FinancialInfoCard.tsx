
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Hash } from 'lucide-react';

interface FinancialInfoCardProps {
  policy: any;
}

export const FinancialInfoCard = ({ policy }: FinancialInfoCardProps) => {
  // Calcular número de parcelas dos dados da apólice
  const getInstallmentsCount = () => {
    if (policy.quantidade_parcelas) return policy.quantidade_parcelas;
    if (policy.installments && Array.isArray(policy.installments)) return policy.installments.length;
    return null;
  };

  const installmentsCount = getInstallmentsCount();

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-amber-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-amber-900 font-sf-pro">
          <DollarSign className="h-6 w-6 mr-3 text-amber-600" />
          Informações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 shadow-md">
          <label className="text-sm font-medium text-white/90 font-sf-pro block mb-2">Prêmio Anual</label>
          <p className="text-3xl font-bold text-white font-sf-pro">
            R$ {(policy.valor_premio || policy.premium || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
          <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">Prêmio Mensal</label>
          <p className="text-2xl font-bold text-gray-900 font-sf-pro">
            R$ {((policy.valor_premio || policy.premium || 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {installmentsCount && installmentsCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <label className="text-sm font-medium text-blue-700 font-sf-pro flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4" />
              Parcelamento
            </label>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-md">
                {installmentsCount}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 font-sf-pro">
                  {installmentsCount}x parcelas
                </p>
                <p className="text-sm text-blue-600 font-sf-pro">
                  Pagamento facilitado
                </p>
              </div>
            </div>
          </div>
        )}

        {(policy.forma_pagamento || policy.paymentForm) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">
              Forma de Pagamento
            </label>
            <p className="text-base font-medium text-gray-900 font-sf-pro capitalize">
              {policy.forma_pagamento || policy.paymentForm}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
