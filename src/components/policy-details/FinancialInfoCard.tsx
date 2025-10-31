
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
    quantidade_parcelas: policy.quantidade_parcelas,
    valor_parcela: policy.valor_parcela,
    installments: policy.installments?.length,
    parcelas: policy.parcelas?.length,
    premiumValue,
    monthlyValue
  });
  
  // Calcular número de parcelas dos dados da apólice
  const getInstallmentsCount = () => {
    // 1. PRIORIDADE: quantidade_parcelas do banco (vem do numpar da API)
    if (policy.quantidade_parcelas !== undefined && policy.quantidade_parcelas !== null) {
      console.log('📊 Usando quantidade_parcelas do banco:', policy.quantidade_parcelas);
      return policy.quantidade_parcelas;
    }
    
    // 2. Fallback: contar installments array
    if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
      console.log('📊 Usando installments.length:', policy.installments.length);
      return policy.installments.length;
    }
    
    // 3. Fallback: contar parcelas array
    if (policy.parcelas && Array.isArray(policy.parcelas) && policy.parcelas.length > 0) {
      console.log('📊 Usando parcelas.length:', policy.parcelas.length);
      return policy.parcelas.length;
    }
    
    // 4. Último fallback: 1 parcela à vista
    console.warn('⚠️ Nenhuma informação de parcelas encontrada, usando 1 parcela');
    return 1;
  };

  // CORREÇÃO: Calcular prêmio mensal corretamente usando valores já extraídos
  const calculateMonthlyPremium = () => {
    // 1. Priorizar valor_parcela do banco (valor real da parcela da API)
    if (policy.valor_parcela && policy.valor_parcela > 0) {
      console.log('💵 Usando valor_parcela do banco:', policy.valor_parcela);
      return policy.valor_parcela;
    }
    
    // 2. Se há valor mensal definido, usar ele
    if (monthlyValue && monthlyValue > 0) {
      console.log('💵 Usando monthlyValue calculado:', monthlyValue);
      return monthlyValue;
    }
    
    // 3. Calcular baseado no número de parcelas
    const installmentsCount = getInstallmentsCount();
    if (installmentsCount > 0 && premiumValue > 0) {
      const calculated = premiumValue / installmentsCount;
      console.log('💵 Calculando prêmio mensal:', premiumValue, '/', installmentsCount, '=', calculated);
      return calculated;
    }
    
    // 4. Fallback: usar o prêmio total (pagamento à vista)
    console.warn('⚠️ Usando prêmio total como valor da parcela:', premiumValue);
    return premiumValue;
  };

  const installmentsCount = getInstallmentsCount();
  const monthlyPremium = calculateMonthlyPremium();
  
  // Obter parcelas com datas e valores
  const getInstallmentsDetails = () => {
    // Se houver installments detalhados, usar
    if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
      console.log('📋 Usando installments array:', policy.installments.length);
      return policy.installments;
    }
    
    // Se houver parcelas array, usar
    if (policy.parcelas && Array.isArray(policy.parcelas) && policy.parcelas.length > 0) {
      console.log('📋 Usando parcelas array:', policy.parcelas.length);
      return policy.parcelas;
    }
    
    // Se não houver parcelas detalhadas, gerar parcelas baseadas em quantidade_parcelas
    const installments = [];
    const startDate = policy.startDate || policy.inicio_vigencia 
      ? new Date(policy.startDate || policy.inicio_vigencia) 
      : new Date();
    
    console.log('📋 Gerando parcelas genéricas:', installmentsCount);
    
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
