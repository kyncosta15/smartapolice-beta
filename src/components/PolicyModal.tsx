
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, FileText, Shield, Users, Building } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy?: any;
}

export const PolicyModal = ({ isOpen, onClose, policy }: PolicyModalProps) => {
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    type: policy?.type || '',
    insurer: policy?.insurer || '',
    policyNumber: policy?.policyNumber || '',
    category: policy?.category || '',
    premium: policy?.premium || '',
    coverage: policy?.coverage || '',
    startDate: policy?.startDate || '',
    endDate: policy?.endDate || '',
    status: policy?.status || 'active',
    entity: policy?.entity || '',
    deductible: '',
    paymentMethod: '',
    installments: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving policy:', formData);
    onClose();
  };

  const isEditMode = !!policy;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>{isEditMode ? 'Editar Apólice' : 'Nova Apólice'}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="coverage">Cobertura</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="management">Gestão</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Informações Básicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Apólice</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Seguro Frota Executiva"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Tipo de Seguro</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Seguro Auto</SelectItem>
                        <SelectItem value="vida">Seguro de Vida</SelectItem>
                        <SelectItem value="saude">Seguro Saúde</SelectItem>
                        <SelectItem value="empresarial">Empresarial</SelectItem>
                        <SelectItem value="patrimonial">Patrimonial</SelectItem>
                        <SelectItem value="responsabilidade">Responsabilidade Civil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="insurer">Seguradora</Label>
                    <Select value={formData.insurer} onValueChange={(value) => handleInputChange('insurer', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a seguradora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                        <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                        <SelectItem value="Bradesco Seguros">Bradesco Seguros</SelectItem>
                        <SelectItem value="Allianz">Allianz</SelectItem>
                        <SelectItem value="Mapfre">Mapfre</SelectItem>
                        <SelectItem value="Tokio Marine">Tokio Marine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="policyNumber">Número da Apólice</Label>
                    <Input
                      id="policyNumber"
                      value={formData.policyNumber}
                      onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                      placeholder="Ex: PS-2024-001847"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pessoal">Pessoal</SelectItem>
                        <SelectItem value="Frota">Frota</SelectItem>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Imóvel">Imóvel</SelectItem>
                        <SelectItem value="Equipamento">Equipamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="entity">Vínculo</Label>
                    <Input
                      id="entity"
                      value={formData.entity}
                      onChange={(e) => handleInputChange('entity', e.target.value)}
                      placeholder="Ex: Matriz - São Paulo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Cobertura e Detalhamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="coverage">Cobertura Principal</Label>
                  <Input
                    id="coverage"
                    value={formData.coverage}
                    onChange={(e) => handleInputChange('coverage', e.target.value)}
                    placeholder="Ex: Compreensiva, Incêndio/Roubo"
                  />
                </div>

                <div>
                  <Label htmlFor="deductible">Franquia</Label>
                  <Input
                    id="deductible"
                    value={formData.deductible}
                    onChange={(e) => handleInputChange('deductible', e.target.value)}
                    placeholder="Ex: R$ 2.500,00"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Cláusulas Específicas e Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Descreva exclusões, carências, condições especiais..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Informações Financeiras</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="premium">Prêmio Total Anual</Label>
                    <Input
                      id="premium"
                      type="number"
                      value={formData.premium}
                      onChange={(e) => handleInputChange('premium', e.target.value)}
                      placeholder="Ex: 12450.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vista">À Vista</SelectItem>
                        <SelectItem value="boleto">Boleto Mensal</SelectItem>
                        <SelectItem value="fatura">Fatura Empresarial</SelectItem>
                        <SelectItem value="debito">Débito Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="installments">Número de Parcelas</Label>
                    <Select value={formData.installments} onValueChange={(value) => handleInputChange('installments', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x (À Vista)</SelectItem>
                        <SelectItem value="6">6x</SelectItem>
                        <SelectItem value="12">12x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Valor Mensal</Label>
                    <div className="p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">
                        R$ {formData.premium ? (parseFloat(formData.premium) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Gestão e Ciclo de Vida</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="expiring">Vencendo</SelectItem>
                        <SelectItem value="expired">Vencida</SelectItem>
                        <SelectItem value="under_review">Em Análise</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dias para Vencimento</Label>
                    <div className="p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">
                        {formData.endDate ? 
                          Math.ceil((new Date(formData.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + ' dias'
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Configurações de Alertas</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Alertar 30 dias antes do vencimento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Alertar 15 dias antes do vencimento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Alertar para variação de custo > 20%</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {isEditMode ? 'Salvar Alterações' : 'Criar Apólice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
