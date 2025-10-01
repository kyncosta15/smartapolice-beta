
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PolicyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onSave: (updatedPolicy: any) => void;
}

export const PolicyEditModal = ({ isOpen, onClose, policy, onSave }: PolicyEditModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    insurer: '',
    premium: '',
    monthlyAmount: '',
    status: '',
    startDate: '',
    endDate: '',
    policyNumber: '',
    category: '',
    entity: '',
    coverage: '',
    paymentForm: '',
    installments: '',
    deductible: '',
    limits: '',
    // Campos específicos do N8N
    insuredName: '',
    documento: '',
    documento_tipo: '',
    vehicleModel: '',
    uf: '',
    responsavel_nome: ''
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || '',
        type: policy.type || '',
        insurer: policy.insurer || '',
        // CORREÇÃO: Priorizar valor_premio do banco
        premium: (policy.valor_premio || policy.premium)?.toString() || '',
        // CORREÇÃO: Priorizar custo_mensal do banco
        monthlyAmount: (policy.custo_mensal || policy.valor_parcela || policy.monthlyAmount)?.toString() || '',
        status: policy.status || '',
        startDate: policy.startDate || '',
        endDate: policy.endDate || '',
        // CORREÇÃO: Priorizar numero_apolice do banco
        policyNumber: policy.numero_apolice || policy.policyNumber || '',
        category: policy.category || '',
        entity: policy.entity || '',
        coverage: Array.isArray(policy.coverage) ? policy.coverage.join(', ') : policy.coverage || '',
        // CORREÇÃO: Priorizar forma_pagamento do banco
        paymentForm: policy.forma_pagamento || policy.paymentForm || '',
        // CORREÇÃO: Priorizar quantidade_parcelas do banco
        installments: (policy.quantidade_parcelas || policy.installments)?.toString() || '',
        // CORREÇÃO: Priorizar franquia do banco
        deductible: (policy.franquia || policy.deductible)?.toString() || '',
        limits: policy.limits || '',
        // Campos específicos do N8N
        insuredName: policy.insuredName || '',
        documento: policy.documento || '',
        documento_tipo: policy.documento_tipo || '',
        // CORREÇÃO: Priorizar modelo_veiculo do banco
        vehicleModel: policy.modelo_veiculo || policy.vehicleModel || '',
        uf: policy.uf || '',
        responsavel_nome: policy.responsavel_nome || ''
      });
    }
  }, [policy]);

  const handleSave = async () => {
    console.log('🚀 [PolicyEditModal] ========== HANDLERSAVE INICIADO ==========');
    console.log('📋 [PolicyEditModal] formData.name:', formData.name);
    console.log('📋 [PolicyEditModal] policy original:', policy);
    
    const premiumValue = parseFloat(formData.premium) || 0;
    const monthlyValue = parseFloat(formData.monthlyAmount) || 0;
    const installmentsCount = parseInt(formData.installments) || 12;
    
    console.log('🔍 [PolicyEditModal] Valores parseados:', {
      premiumValue,
      monthlyValue,
      installmentsCount,
      type: formData.type
    });
    
    // CRÍTICO: Garantir que name vem do formData, NÃO do policy original
    const updatedPolicy = {
      id: policy.id,
      name: formData.name,  // ← Este é o valor editado no formulário
      type: formData.type,
      tipo_seguro: formData.type,
      insurer: formData.insurer,
      premium: premiumValue,
      valor_premio: premiumValue,
      monthlyAmount: monthlyValue,
      custo_mensal: monthlyValue,
      valor_parcela: monthlyValue,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      policyNumber: formData.policyNumber,
      numero_apolice: formData.policyNumber,
      category: formData.category,
      entity: formData.entity,
      coverage: formData.coverage.split(', ').map(c => c.trim()),
      paymentForm: formData.paymentForm,
      forma_pagamento: formData.paymentForm,
      installments: installmentsCount,
      quantidade_parcelas: installmentsCount,
      deductible: parseFloat(formData.deductible) || 0,
      franquia: parseFloat(formData.deductible) || 0,
      limits: formData.limits,
      insuredName: formData.insuredName,
      documento: formData.documento,
      documento_tipo: formData.documento_tipo,
      vehicleModel: formData.vehicleModel,
      modelo_veiculo: formData.vehicleModel,
      uf: formData.uf,
      responsavel_nome: formData.responsavel_nome
    };

    // CRÍTICO: Verificar o objeto ANTES de enviar
    alert(`📦 OBJETO CRIADO NO MODAL:\nname: ${updatedPolicy.name}\nid: ${updatedPolicy.id}`);
    console.log('💾 [PolicyEditModal] Objeto completo a ser salvo:', JSON.stringify(updatedPolicy, null, 2));
    console.log('📞 [PolicyEditModal] Chamando onSave callback...');

    try {
      await onSave(updatedPolicy);
      console.log('✅ [PolicyEditModal] onSave callback concluído com sucesso');
    } catch (error) {
      console.error('❌ [PolicyEditModal] Erro no callback onSave:', error);
    }
    
    console.log('🚪 [PolicyEditModal] Fechando modal...');
    onClose();
    console.log('🏁 [PolicyEditModal] ========== HANDLERSAVE FINALIZADO ==========');
  };

  if (!policy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b pb-3 px-4 pt-4 sm:px-6 sm:pt-6 sticky top-0 bg-white z-10">
          <DialogTitle className="text-lg sm:text-xl">Editar Apólice</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Apólice</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="vida">Vida</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="patrimonial">Patrimonial</SelectItem>
                  <SelectItem value="acidentes_pessoais">Acidentes Pessoais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="insurer">Seguradora</Label>
              <Input
                id="insurer"
                value={formData.insurer}
                onChange={(e) => setFormData({...formData, insurer: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="premium">Prêmio Anual (R$)</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                value={formData.premium}
                onChange={(e) => {
                  const annualValue = e.target.value;
                  const installments = parseInt(formData.installments) || 12;
                  const monthlyValue = annualValue ? (parseFloat(annualValue) / installments).toFixed(2) : '';
                  
                  setFormData({
                    ...formData, 
                    premium: annualValue,
                    monthlyAmount: monthlyValue
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.installments && formData.premium && `${formData.installments}x de R$ ${(parseFloat(formData.premium) / parseInt(formData.installments)).toFixed(2)}`}
              </p>
            </div>

            <div>
              <Label htmlFor="monthlyAmount">Valor Mensal (R$)</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={formData.monthlyAmount}
                onChange={(e) => {
                  const monthlyValue = e.target.value;
                  const installments = parseInt(formData.installments) || 12;
                  const annualValue = monthlyValue ? (parseFloat(monthlyValue) * installments).toFixed(2) : '';
                  
                  setFormData({
                    ...formData, 
                    monthlyAmount: monthlyValue,
                    premium: annualValue
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor anual calculado: R$ {formData.monthlyAmount && formData.installments ? (parseFloat(formData.monthlyAmount) * parseInt(formData.installments)).toFixed(2) : '0.00'}
              </p>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="under_review">Em Análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="responsavel_nome">Responsável</Label>
              <Input
                id="responsavel_nome"
                placeholder="Nome do responsável"
                value={formData.responsavel_nome}
                onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="policyNumber">Número da Apólice</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="entity">Corretora</Label>
              <Input
                id="entity"
                value={formData.entity}
                onChange={(e) => setFormData({...formData, entity: e.target.value})}
              />
            </div>

            {/* Campos específicos para N8N */}
            <div>
              <Label htmlFor="insuredName">Nome do Segurado</Label>
              <Input
                id="insuredName"
                value={formData.insuredName}
                onChange={(e) => setFormData({...formData, insuredName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="documento_tipo">Tipo</Label>
                <Select value={formData.documento_tipo} onValueChange={(value) => setFormData({...formData, documento_tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos específicos para Auto */}
            {formData.type === 'auto' && (
              <>
                <div>
                  <Label htmlFor="vehicleModel">Modelo do Veículo</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deductible">Franquia (R$)</Label>
                  <Input
                    id="deductible"
                    type="number"
                    step="0.01"
                    value={formData.deductible}
                    onChange={(e) => setFormData({...formData, deductible: e.target.value})}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="uf">Estado (UF)</Label>
              <Select value={formData.uf} onValueChange={(value) => setFormData({...formData, uf: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coverage">Cobertura</Label>
              <Textarea
                id="coverage"
                value={formData.coverage}
                onChange={(e) => setFormData({...formData, coverage: e.target.value})}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4 px-4 pb-4 sm:px-6 sm:pb-6 border-t pt-4 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              console.log('🖱️ [PolicyEditModal] Botão "Salvar Alterações" CLICADO');
              handleSave();
            }} 
            className="w-full sm:w-auto"
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
