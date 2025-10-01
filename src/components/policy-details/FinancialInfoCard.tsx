
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Hash } from 'lucide-react';

interface FinancialInfoCardProps {
  policy: any;
}

export const FinancialInfoCard = ({ policy }: FinancialInfoCardProps) => {
  // Calcular número de parcelas dos dados da apólice
  const getInstallmentsCount = () => {
    // Priorizar quantidade_parcelas do banco
    if (policy.quantidade_parcelas && policy.quantidade_parcelas > 0) {
      return policy.quantidade_parcelas;
    }
    
    // Fallback para installments array
    if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
      return policy.installments.length;
    }
    
    // Fallback para parcelas array (legacy)
    if (policy.parcelas && Array.isArray(policy.parcelas) && policy.parcelas.length > 0) {
      return policy.parcelas.length;
    }
    
    // Último fallback para 12 parcelas (padrão)
    return 12;
  };

  // CORREÇÃO: Calcular prêmio mensal corretamente
  const calculateMonthlyPremium = () => {
    const premiumValue = policy.valor_premio || policy.premium || 0;
    
    // Se há custo_mensal definido, usar ele
    if (policy.custo_mensal && policy.custo_mensal > 0) {
      return policy.custo_mensal;
    }
    
    // Se há monthlyAmount definido, usar ele
    if (policy.monthlyAmount && policy.monthlyAmount > 0) {
      return policy.monthlyAmount;
    }
    
    // Se há valor_parcela definido, usar ele
    if (policy.valor_parcela && policy.valor_parcela > 0) {
      return policy.valor_parcela;
    }
    
    // Calcular baseado no número de parcelas
    const installmentsCount = getInstallmentsCount();
    if (installmentsCount > 0) {
      return premiumValue / installmentsCount;
    }
    
    // Fallback: dividir por 12
    return premiumValue / 12;
  };

  const installmentsCount = getInstallmentsCount();
  const monthlyPremium = calculateMonthlyPremium();

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-amber-200 pb-3 px-4 sm:px-6 pt-4">
        <CardTitle className="flex items-center text-lg sm:text-xl font-bold text-amber-900 font-sf-pro">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-amber-600" />
          Informações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 sm:p-6 shadow-md">
          <label className="text-xs sm:text-sm font-medium text-white/90 font-sf-pro block mb-2">Prêmio Anual</label>
          <p className="text-2xl sm:text-3xl font-bold text-white font-sf-pro break-all">
            R$ {(policy.valor_premio || policy.premium || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-amber-100">
          <label className="text-xs sm:text-sm font-medium text-amber-700 font-sf-pro block mb-1">Prêmio Mensal</label>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-sf-pro break-all">
            R$ {monthlyPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-100">
          <label className="text-xs sm:text-sm font-medium text-blue-700 font-sf-pro flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4" />
            Parcelamento
          </label>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
              {installmentsCount}
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-gray-900 font-sf-pro">
                {installmentsCount}x parcelas
              </p>
              <p className="text-xs sm:text-sm text-blue-600 font-sf-pro">
                Pagamento facilitado
              </p>
            </div>
          </div>
        </div>

        {(policy.forma_pagamento || policy.paymentForm) && (
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-amber-100">
            <label className="text-xs sm:text-sm font-medium text-amber-700 font-sf-pro block mb-1">
              Forma de Pagamento
            </label>
            <p className="text-sm sm:text-base font-medium text-gray-900 font-sf-pro capitalize">
              {policy.forma_pagamento || policy.paymentForm}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
