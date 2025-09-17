import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  User, 
  FileText, 
  Shield, 
  DollarSign, 
  AlertTriangle,
  Settings,
  Calendar,
  Upload,
  RefreshCw,
  X,
  Eye,
  Edit
} from 'lucide-react';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fipeService } from '@/services/fipeService';

interface VehicleDetailsModalNewProps {
  veiculo: FrotaVeiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedVeiculo: FrotaVeiculo) => void;
  mode?: 'view' | 'edit';
}

export function VehicleDetailsModalNew({ 
  veiculo, 
  open, 
  onOpenChange, 
  onSave,
  mode = 'view'
}: VehicleDetailsModalNewProps) {
  const [activeTab, setActiveTab] = useState('veiculo');
  const [formData, setFormData] = useState<Partial<FrotaVeiculo>>({});
  const [loading, setLoading] = useState(false);
  const [fipeUpdateLoading, setFipeUpdateLoading] = useState(false);
  const [fipeUpdateInfo, setFipeUpdateInfo] = useState<{
    updated: boolean;
    oldValue?: number;
    newValue?: number;
  }>({ updated: false });

  useEffect(() => {
    if (veiculo) {
      setFormData({ ...veiculo });
      setFipeUpdateInfo({ updated: false });
    }
  }, [veiculo]);

  const handleInputChange = (field: keyof FrotaVeiculo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateFipe = async () => {
    if (!formData.marca || !formData.modelo || !formData.ano_modelo) {
      toast.error('Informações do veículo são necessárias para buscar o valor FIPE');
      return;
    }

    setFipeUpdateLoading(true);
    try {
      const fipeValue = await fipeService.getPrice({
        marca: formData.marca,
        modelo: formData.modelo,
        ano_modelo: formData.ano_modelo
      });

      if (fipeValue) {
        const oldValue = formData.preco_fipe;
        setFormData(prev => ({ ...prev, preco_fipe: fipeValue.valor }));
        setFipeUpdateInfo({
          updated: true,
          oldValue,
          newValue: fipeValue.valor
        });
        toast.success('Valor FIPE atualizado com sucesso!');
      } else {
        toast.error('Não foi possível encontrar o valor FIPE para este veículo');
      }
    } catch (error) {
      console.error('Erro ao buscar valor FIPE:', error);
      toast.error('Erro ao buscar valor FIPE');
    } finally {
      setFipeUpdateLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('frota_veiculos')
        .update(formData)
        .eq('id', formData.id);

      if (error) throw error;

      if (onSave) {
        onSave(formData as FrotaVeiculo);
      }

      toast.success('Veículo atualizado com sucesso!');
      
      // Dispatch event to refresh the table
      window.dispatchEvent(new CustomEvent('vehicleUpdated'));
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar as alterações');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'vigente': { color: 'bg-green-100 text-green-800', label: 'Vigente' },
      'vencido': { color: 'bg-red-100 text-red-800', label: 'Vencido' },
      'vence_30_dias': { color: 'bg-yellow-100 text-yellow-800', label: 'Vence em 30 dias' },
      'vence_60_dias': { color: 'bg-blue-100 text-blue-800', label: 'Vence em 60 dias' },
      'sem_seguro': { color: 'bg-gray-100 text-gray-800', label: 'Sem Seguro' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config['sem_seguro'];
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getCategoriaBadge = (categoria: string) => {
    const labels = {
      'passeio': 'Passeio',
      'utilitario': 'Utilitário', 
      'caminhao': 'Caminhão',
      'moto': 'Moto',
      'outros': 'Outros'
    };

    return (
      <Badge variant="secondary">
        {labels[categoria as keyof typeof labels] || categoria}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold">{formData.marca} {formData.modelo}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                      {formData.placa}
                    </span>
                    {getCategoriaBadge(formData.categoria)}
                    {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualização
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Editando
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <div className="shrink-0 px-1 py-4">
              <div className="flex flex-wrap gap-2 md:gap-1">
                <TabsTrigger 
                  value="veiculo" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <Car className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Veículo</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="proprietario" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Proprietário</span>
                  <span className="sm:hidden">Dono</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="emplacamento" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Emplacamento</span>
                  <span className="sm:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="seguro" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Seguro</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="operacao" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Operação</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="valores" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Valores</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sinistros" 
                  className="flex-1 min-w-[100px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 transition-all duration-200 rounded-lg px-4 py-2"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Sinistros</span>
                </TabsTrigger>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <TabsContent value="veiculo" className="mt-0 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Car className="h-5 w-5 text-blue-600" />
                    Informações do Veículo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="marca" className="text-sm font-medium text-gray-700">Marca</Label>
                      <Input
                        id="marca"
                        value={formData.marca || ''}
                        onChange={(e) => handleInputChange('marca', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modelo" className="text-sm font-medium text-gray-700">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo || ''}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ano_modelo" className="text-sm font-medium text-gray-700">Ano do Modelo</Label>
                      <Input
                        id="ano_modelo"
                        type="number"
                        value={formData.ano_modelo || ''}
                        onChange={(e) => handleInputChange('ano_modelo', parseInt(e.target.value) || null)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">Categoria</Label>
                      <Select 
                        value={formData.categoria || ''} 
                        onValueChange={(value) => handleInputChange('categoria', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passeio">Passeio</SelectItem>
                          <SelectItem value="utilitario">Utilitário</SelectItem>
                          <SelectItem value="caminhao">Caminhão</SelectItem>
                          <SelectItem value="moto">Moto</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2 xl:col-span-2">
                      <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes || ''}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        disabled={mode === 'view'}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="proprietario" className="mt-0 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informações do Proprietário
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="proprietario_nome" className="text-sm font-medium text-gray-700">Nome do Proprietário</Label>
                      <Input
                        id="proprietario_nome"
                        value={formData.proprietario_nome || ''}
                        onChange={(e) => handleInputChange('proprietario_nome', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proprietario_tipo" className="text-sm font-medium text-gray-700">Tipo</Label>
                      <Select 
                        value={formData.proprietario_tipo || ''} 
                        onValueChange={(value) => handleInputChange('proprietario_tipo', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fisica">Pessoa Física</SelectItem>
                          <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="proprietario_doc" className="text-sm font-medium text-gray-700">CPF/CNPJ</Label>
                      <Input
                        id="proprietario_doc"
                        value={formData.proprietario_doc || ''}
                        onChange={(e) => handleInputChange('proprietario_doc', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="emplacamento" className="mt-0 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações de Emplacamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="placa" className="text-sm font-medium text-gray-700">Placa</Label>
                      <Input
                        id="placa"
                        value={formData.placa || ''}
                        onChange={(e) => handleInputChange('placa', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="renavam" className="text-sm font-medium text-gray-700">Renavam</Label>
                      <Input
                        id="renavam"
                        value={formData.renavam || ''}
                        onChange={(e) => handleInputChange('renavam', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-11 font-mono"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="seguro" className="mt-0 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Status do Seguro
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Status Atual</Label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                      </div>
                    </div>
                    {formData.motivo_sem_seguro && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Motivo sem Seguro</Label>
                        <p className="p-4 bg-yellow-50 rounded-lg text-yellow-800">
                          {formData.motivo_sem_seguro}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="operacao" className="mt-0 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Informações Operacionais
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="observacoes_operacao" className="text-sm font-medium text-gray-700">Observações Operacionais</Label>
                      <Textarea
                        id="observacoes_operacao"
                        value={formData.observacoes_operacao || ''}
                        onChange={(e) => handleInputChange('observacoes_operacao', e.target.value)}
                        disabled={mode === 'view'}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="valores" className="mt-0 space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      Informações Financeiras
                    </h3>
                    {mode === 'edit' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUpdateFipe}
                        disabled={fipeUpdateLoading}
                      >
                        {fipeUpdateLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar FIPE
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preco_nf" className="text-sm font-medium text-gray-700">Valor da Nota Fiscal</Label>
                      <Input
                        id="preco_nf"
                        type="number"
                        value={formData.preco_nf || ''}
                        onChange={(e) => handleInputChange('preco_nf', parseFloat(e.target.value) || null)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preco_fipe" className="text-sm font-medium text-gray-700">
                        Valor FIPE
                        {fipeUpdateInfo.updated && (
                          <span className="text-green-600 text-xs ml-2">Atualizado!</span>
                        )}
                      </Label>
                      <Input
                        id="preco_fipe"
                        type="number"
                        value={formData.preco_fipe || ''}
                        onChange={(e) => handleInputChange('preco_fipe', parseFloat(e.target.value) || null)}
                        disabled={mode === 'view'}
                        className="h-11"
                      />
                    </div>
                  </div>
                </Card>

                {formData.preco_fipe && formData.preco_nf && (
                  <Card className="p-6 bg-gray-50">
                    <h4 className="text-md font-semibold mb-4">Análise FIPE vs Nota Fiscal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-muted-foreground">Valor NF</p>
                        <p className="text-lg font-semibold">{formatCurrency(formData.preco_nf)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Diferença</p>
                        <p className={`text-lg font-semibold ${formData.preco_fipe > formData.preco_nf ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(formData.preco_fipe - formData.preco_nf))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">% da Tabela</p>
                        <p className="text-lg font-semibold">
                          {((formData.preco_nf / formData.preco_fipe) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="sinistros" className="mt-0 space-y-6">
                <Card className="p-6">
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sinistros do Veículo
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Lista de sinistros relacionados a este veículo será implementada aqui.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div>
            {mode === 'view' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Switch to edit mode
                  if (onSave) {
                    onOpenChange(false);
                    // Reopen in edit mode by calling parent handler
                    setTimeout(() => {
                      // This will be handled by the parent component
                      window.dispatchEvent(new CustomEvent('editVehicle', { detail: veiculo?.id }));
                    }, 100);
                  }
                }}
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Veículo
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {mode === 'edit' ? 'Cancelar' : 'Fechar'}
            </Button>
            {mode === 'edit' && (
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Car className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}