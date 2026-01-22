import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign, Hash, ChevronRight, Calendar, Pencil, Check, X, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FinancialInfoCardProps {
  policy: any;
  onInstallmentsUpdate?: (installments: any[]) => void;
}

export const FinancialInfoCard = ({ policy, onInstallmentsUpdate }: FinancialInfoCardProps) => {
  const { toast } = useToast();
  const [showInstallments, setShowInstallments] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editField, setEditField] = useState<'valor' | 'vencimento' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [localInstallments, setLocalInstallments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Evita bug de timezone: new Date('YYYY-MM-DD') interpreta como UTC e mostra -1 dia no Brasil
  const formatDatePtBr = (value?: string | null) => {
    if (!value) return '';
    const clean = String(value).split('T')[0];
    const [y, m, d] = clean.split('-');
    if (!y || !m || !d) return '';
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  };
  
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
    // Se houver installments detalhados do banco, usar
    if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
      console.log('📋 Usando installments array:', policy.installments.length);
      return policy.installments;
    }
    
    // Se houver parcelas array, usar
    if (policy.parcelas && Array.isArray(policy.parcelas) && policy.parcelas.length > 0) {
      console.log('📋 Usando parcelas array:', policy.parcelas.length);
      return policy.parcelas;
    }
    
    // Se não houver parcelas detalhadas, gerar parcelas SEM datas automáticas
    // Para que o usuário insira manualmente
    const installments = [];
    
    console.log('📋 Gerando parcelas para edição manual:', installmentsCount);
    
    for (let i = 0; i < installmentsCount; i++) {
      installments.push({
        numero: i + 1,
        valor: monthlyPremium,
        vencimento: '', // Deixar vazio para inserção manual
        status: 'pendente'
      });
    }
    
    return installments;
  };
  
  const installmentsDetails = getInstallmentsDetails();

  // CRÍTICO: Carregar parcelas do banco ao abrir o modal
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      // Primeiro, tentar carregar parcelas diretamente do banco
      if (policy.id) {
        console.log('📋 Carregando parcelas do banco para policy:', policy.id);
        const { data: dbInstallments, error } = await supabase
          .from('installments')
          .select('id, numero_parcela, valor, data_vencimento, status')
          .eq('policy_id', policy.id)
          .order('numero_parcela', { ascending: true });
        
        if (!error && dbInstallments && dbInstallments.length > 0) {
          console.log('✅ Parcelas carregadas do banco:', dbInstallments.length);
          setLocalInstallments(dbInstallments.map((inst: any) => ({
            id: inst.id,
            numero: inst.numero_parcela,
            valor: inst.valor ?? monthlyPremium,
            vencimento: inst.data_vencimento || '',
            status: inst.status || 'pendente'
          })));
          setHasChanges(false);
          setShowInstallments(open);
          return;
        }
      }
      
      // Fallback: usar dados da policy (memória)
      console.log('📋 Usando parcelas da memória');
      setLocalInstallments(installmentsDetails.map((inst: any, idx: number) => ({
        id: inst.id,
        numero: inst.numero || inst.number || idx + 1,
        valor: inst.valor || inst.value || monthlyPremium,
        vencimento: inst.vencimento || inst.dueDate || inst.date || inst.data_vencimento || '',
        status: inst.status || 'pendente'
      })));
      setHasChanges(false);
    }
    setShowInstallments(open);
  };

  const handleStartEdit = (index: number, currentValue: number) => {
    setEditingIndex(index);
    setEditField('valor');
    setEditValue(currentValue.toFixed(2).replace('.', ','));
  };

  const handleStartEditDate = (index: number, currentDate: string) => {
    setEditingIndex(index);
    setEditField('vencimento');
    setEditValue(currentDate || '');
  };

  const handleConfirmEdit = (index: number) => {
    const newInstallments = [...localInstallments];
    
    if (editField === 'valor') {
      const newValue = parseFloat(editValue.replace(',', '.'));
      if (!isNaN(newValue) && newValue >= 0) {
        newInstallments[index] = {
          ...newInstallments[index],
          valor: newValue
        };
        setLocalInstallments(newInstallments);
        setHasChanges(true);
      }
    } else if (editField === 'vencimento') {
      newInstallments[index] = {
        ...newInstallments[index],
        vencimento: editValue
      };
      setLocalInstallments(newInstallments);
      setHasChanges(true);
    }
    
    setEditingIndex(null);
    setEditField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditField(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleConfirmEdit(index);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSaveInstallments = async () => {
    if (!policy.id) return;
    
    setIsSaving(true);
    let hasError = false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('💾 Salvando parcelas...', localInstallments.length);

      // Atualizar ou criar cada parcela no banco
      for (const inst of localInstallments) {
        if (inst.id) {
          // Atualizar parcela existente (valor E data)
          console.log(`📝 Atualizando parcela ${inst.id}:`, { valor: inst.valor, vencimento: inst.vencimento });
          const { error } = await supabase
            .from('installments')
            .update({ 
              valor: inst.valor,
              data_vencimento: inst.vencimento || null
            })
            .eq('id', inst.id);
          
          if (error) {
            console.error('❌ Erro ao atualizar parcela:', error);
            hasError = true;
          }
        } else {
          // Criar nova parcela no banco se não existir
          console.log(`➕ Criando nova parcela:`, { numero: inst.numero, valor: inst.valor });
          const { error } = await supabase
            .from('installments')
            .insert({
              policy_id: policy.id,
              user_id: user.id,
              numero_parcela: inst.numero,
              valor: inst.valor,
              data_vencimento: inst.vencimento || null,
              status: inst.status || 'pendente'
            });
          
          if (error) {
            console.error('❌ Erro ao criar parcela:', error);
            hasError = true;
          }
        }
      }

      // CRÍTICO: Calcular novo valor mensal (média das parcelas) e atualizar na apólice
      const totalParcelas = localInstallments.reduce((sum, inst) => sum + (inst.valor || 0), 0);
      const novoValorMensal = localInstallments.length > 0 
        ? totalParcelas / localInstallments.length 
        : monthlyPremium;
      
      console.log('💰 Atualizando custo_mensal da apólice:', {
        policy_id: policy.id,
        totalParcelas,
        qtdParcelas: localInstallments.length,
        novoValorMensal
      });

      const { error: policyError } = await supabase
        .from('policies')
        .update({ 
          custo_mensal: novoValorMensal,
          valor_parcela: novoValorMensal
        })
        .eq('id', policy.id);

      if (policyError) {
        console.error('❌ Erro ao atualizar custo_mensal da apólice:', policyError);
        hasError = true;
      }

      if (hasError) {
        toast({
          title: "⚠️ Atenção",
          description: "Algumas alterações podem não ter sido salvas. Tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Parcelas atualizadas",
          description: "Os valores e datas das parcelas foram salvos com sucesso",
        });
      }

      setHasChanges(false);
      
      // CRÍTICO: Chamar callback para atualizar o dashboard/projeção
      console.log('🔄 Chamando onInstallmentsUpdate para refresh...');
      onInstallmentsUpdate?.(localInstallments);
      
    } catch (error) {
      console.error('❌ Erro ao salvar parcelas:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalValue = localInstallments.reduce((sum, inst) => sum + (inst.valor || 0), 0);

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
                  Clique para editar valores
                </p>
              </div>
            </div>
            
            <Dialog open={showInstallments} onOpenChange={handleOpenChange}>
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
                    Editar Parcelas
                  </DialogTitle>
                </DialogHeader>
                
                <p className="text-xs text-muted-foreground">
                  Clique no valor ou na data para editar manualmente
                </p>
                
                <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
                  {localInstallments.map((installment, index) => {
                    const valor = installment.valor || monthlyPremium;
                    const vencimento = installment.vencimento;
                    const numero = installment.numero || index + 1;
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                            {numero}
                          </div>
                          <div className="flex flex-col gap-1">
                            {/* Valor - Editável */}
                            {editingIndex === index && editField === 'valor' ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">R$</span>
                                <Input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  className="w-28 h-7 text-sm"
                                  placeholder="0,00"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleConfirmEdit(index)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(index, valor)}
                                className="flex items-center gap-1.5 group text-left"
                              >
                                <span className="text-sm font-semibold text-gray-900">
                                  R$ {Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                            
                            {/* Data - Editável */}
                            {editingIndex === index && editField === 'vencimento' ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  autoFocus
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  className="w-36 h-7 text-sm"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleConfirmEdit(index)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditDate(index, vencimento || '')}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 group cursor-pointer"
                              >
                                <Calendar className="h-3 w-3" />
                                {vencimento ? formatDatePtBr(vencimento) : 'Inserir data'}
                                <Pencil className="h-2.5 w-2.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
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
                    <span className={cn(
                      "text-lg font-bold",
                      Math.abs(totalValue - premiumValue) > 0.01 && premiumValue > 0 
                        ? "text-amber-600" 
                        : "text-blue-900"
                    )}>
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {Math.abs(totalValue - premiumValue) > 0.01 && premiumValue > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Total difere do prêmio anual (R$ {premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </p>
                  )}
                </div>

                {hasChanges && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleSaveInstallments}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                )}
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
