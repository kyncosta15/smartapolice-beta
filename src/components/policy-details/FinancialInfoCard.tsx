
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign, Hash, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';

interface FinancialInfoCardProps {
  policy: any;
}

export const FinancialInfoCard = ({ policy }: FinancialInfoCardProps) => {
  const [showInstallments, setShowInstallments] = useState(false);
  
  // CRÍTICO: Priorizar campos do banco de dados
  const premiumValue = policy.valor_premio ?? policy.premium ?? 0;
  const monthlyValue = policy.custo_mensal ?? policy.valor_parcela ?? policy.monthlyAmount ?? 0;
  
  console.log('💰 [FinancialInfoCard] Valores recebidos:', {
    id: policy.id,
    valor_premio: policy.valor_premio,
    premium: policy.premium,
    custo_mensal: policy.custo_mensal,
    monthlyAmount: policy.monthlyAmount,
    premiumValue,
    monthlyValue
  });
  
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

  // CORREÇÃO: Calcular prêmio mensal corretamente usando valores já extraídos
  const calculateMonthlyPremium = () => {
    // Se há valor mensal definido, usar ele
    if (monthlyValue && monthlyValue > 0) {
      return monthlyValue;
    }
    
    // Calcular baseado no número de parcelas
    const installmentsCount = getInstallmentsCount();
    if (installmentsCount > 0 && premiumValue > 0) {
      return premiumValue / installmentsCount;
    }
    
    // Fallback: dividir por 12
    return premiumValue / 12;
  };

  const installmentsCount = getInstallmentsCount();
  const monthlyPremium = calculateMonthlyPremium();
  
  // Obter parcelas com datas e valores
  const getInstallmentsDetails = () => {
    if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
      return policy.installments;
    }
    
    // Se não houver parcelas detalhadas, gerar parcelas genéricas
    const installments = [];
    const startDate = policy.startDate ? new Date(policy.startDate) : new Date();
    
    for (let i = 0; i < installmentsCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: monthlyPremium,
        vencimento: dueDate.toISOString().split('T')[0],
        status: 'pendente'
      });
    }
    
    return installments;
  };
  
  const installmentsDetails = getInstallmentsDetails();

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
            R$ {premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <div className="flex items-center justify-between gap-3">
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
            
            <Dialog open={showInstallments} onOpenChange={setShowInstallments}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-blue-900">
                    <Calendar className="h-5 w-5" />
                    Detalhes das Parcelas
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {installmentsDetails.map((installment, index) => {
                    const valor = installment.valor || installment.value || monthlyPremium;
                    const vencimento = installment.vencimento || installment.dueDate || installment.date;
                    const numero = installment.numero || installment.number || index + 1;
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                            {numero}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              R$ {Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {vencimento && (
                              <p className="text-xs text-blue-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(vencimento).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-blue-900">
                      R$ {(installmentsDetails.reduce((sum, inst) => sum + (inst.valor || inst.value || monthlyPremium), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
