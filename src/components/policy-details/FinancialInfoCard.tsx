
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Hash } from 'lucide-react';
import { extractFieldValue, extractNumericValue } from '@/utils/extractFieldValue';

interface FinancialInfoCardProps {
  policy: any;
}

export const FinancialInfoCard = ({ policy }: FinancialInfoCardProps) => {
  // Calcular número de parcelas dos dados da apólice
  const getInstallmentsCount = () => {
    // Priorizar quantidade_parcelas do banco
    const quantidadeParcelas = extractNumericValue(policy.quantidade_parcelas);
    if (quantidadeParcelas > 0) {
      return quantidadeParcelas;
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

  // CORREÇÃO: Calcular prêmio mensal corretamente usando extractNumericValue
  const calculateMonthlyPremium = () => {
    const premiumValue = extractNumericValue(policy.valor_premio) || extractNumericValue(policy.premium) || 0;
    
    // Se há custo_mensal definido, usar ele
    const custoMensal = extractNumericValue(policy.custo_mensal);
    if (custoMensal > 0) {
      return custoMensal;
    }
    
    // Se há monthlyAmount definido, usar ele
    const monthlyAmount = extractNumericValue(policy.monthlyAmount);
    if (monthlyAmount > 0) {
      return monthlyAmount;
    }
    
    // Se há valor_parcela definido, usar ele
    const valorParcela = extractNumericValue(policy.valor_parcela);
    if (valorParcela > 0) {
      return valorParcela;
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
  
  // CORREÇÃO: Usar extractNumericValue para garantir que temos números válidos
  const annualPremium = extractNumericValue(policy.valor_premio) || extractNumericValue(policy.premium) || 0;
  
  // CORREÇÃO: Usar extractFieldValue para forma de pagamento
  const formaPagamento = extractFieldValue(policy.forma_pagamento) || extractFieldValue(policy.paymentForm);

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
            R$ {annualPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
          <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">Prêmio Mensal</label>
          <p className="text-2xl font-bold text-gray-900 font-sf-pro">
            R$ {monthlyPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

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

        {formaPagamento && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">
              Forma de Pagamento
            </label>
            <p className="text-base font-medium text-gray-900 font-sf-pro capitalize">
              {formaPagamento}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
