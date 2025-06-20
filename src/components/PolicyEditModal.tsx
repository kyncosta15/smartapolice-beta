
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
    limits: ''
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || '',
        type: policy.type || '',
        insurer: policy.insurer || '',
        premium: policy.premium?.toString() || '',
        monthlyAmount: policy.monthlyAmount?.toString() || '',
        status: policy.status || '',
        startDate: policy.startDate || '',
        endDate: policy.endDate || '',
        policyNumber: policy.policyNumber || '',
        category: policy.category || '',
        entity: policy.entity || '',
        coverage: Array.isArray(policy.coverage) ? policy.coverage.join(', ') : policy.coverage || '',
        paymentForm: policy.paymentForm || '',
        installments: policy.installments?.toString() || '',
        deductible: policy.deductible?.toString() || '',
        limits: policy.limits || ''
      });
    }
  }, [policy]);

  const handleSave = () => {
    const updatedPolicy = {
      ...policy,
      name: formData.name,
      type: formData.type,
      insurer: formData.insurer,
      premium: parseFloat(formData.premium) || 0,
      monthlyAmount: parseFloat(formData.monthlyAmount) || 0,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      policyNumber: formData.policyNumber,
      category: formData.category,
      entity: formData.entity,
      coverage: formData.coverage.split(',').map(c => c.trim()),
      paymentForm: formData.paymentForm,
      installments: parseInt(formData.installments) || 0,
      deductible: parseFloat(formData.deductible) || 0,
      limits: formData.limits
    };

    onSave(updatedPolicy);
    toast({
      title: "Apólice Atualizada",
      description: "As informações foram salvas com sucesso",
    });
    onClose();
  };

  if (!policy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Apólice</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onChange={(e) => setFormData({...formData, premium: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="monthlyAmount">Valor Mensal (R$)</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={formData.monthlyAmount}
                onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})}
              />
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
              <Label htmlFor="entity">Entidade</Label>
              <Input
                id="entity"
                value={formData.entity}
                onChange={(e) => setFormData({...formData, entity: e.target.value})}
              />
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

        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
