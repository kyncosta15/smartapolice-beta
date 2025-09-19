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
      
      // Dispatch events to refresh the table and dashboard data
      window.dispatchEvent(new CustomEvent('vehicleUpdated'));
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
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
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="shrink-0 pb-3 px-4 pt-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Car className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold truncate">{formData.marca} {formData.modelo}</h2>
                <div className="flex items-center gap-2 md:gap-3 mt-1 flex-wrap">
                  <span className="text-xs md:text-sm font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                    {formData.placa}
                  </span>
                  {getCategoriaBadge(formData.categoria)}
                  {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {mode === 'view' ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Visualização</span>
                  <span className="sm:hidden">Ver</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Edit className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Editando</span>
                  <span className="sm:hidden">Edit</span>
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <div className="shrink-0 px-2 md:px-4 py-2">
              <TabsList className="grid grid-cols-4 gap-1 h-auto p-1 bg-gray-100 w-full">
                <TabsTrigger 
                  value="veiculo" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <Car className="h-3 w-3 mr-1" />
                  <span>Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="proprietario" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  <span>Dono</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="emplacamento" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  <span>Docs</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="seguro" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  <span>Seguro</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 bg-gray-100 w-full mt-1">
                <TabsTrigger 
                  value="operacao" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  <span>Operação</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="valores" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span>Valores</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sinistros" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 transition-all duration-200 rounded-lg px-1 md:px-2 py-2 text-xs"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Sinistros</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-2 md:px-4 pb-2">
              <TabsContent value="veiculo" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <Car className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Informações do Veículo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="marca" className="text-sm font-medium text-gray-700">Marca</Label>
                      <Input
                        id="marca"
                        value={formData.marca || ''}
                        onChange={(e) => handleInputChange('marca', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modelo" className="text-sm font-medium text-gray-700">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo || ''}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11"
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
                        className="h-10 md:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">Categoria</Label>
                      <Select 
                        value={formData.categoria || ''} 
                        onValueChange={(value) => handleInputChange('categoria', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-10 md:h-11">
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

              <TabsContent value="proprietario" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Informações do Proprietário
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="proprietario_nome" className="text-sm font-medium text-gray-700">Nome do Proprietário</Label>
                      <Input
                        id="proprietario_nome"
                        value={formData.proprietario_nome || ''}
                        onChange={(e) => handleInputChange('proprietario_nome', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proprietario_tipo" className="text-sm font-medium text-gray-700">Tipo</Label>
                      <Select 
                        value={formData.proprietario_tipo || ''} 
                        onValueChange={(value) => handleInputChange('proprietario_tipo', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-10 md:h-11">
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
                        className="h-10 md:h-11"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="emplacamento" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Informações de Emplacamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="placa" className="text-sm font-medium text-gray-700">Placa</Label>
                      <Input
                        id="placa"
                        value={formData.placa || ''}
                        onChange={(e) => handleInputChange('placa', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="renavam" className="text-sm font-medium text-gray-700">Renavam</Label>
                      <Input
                        id="renavam"
                        value={formData.renavam || ''}
                        onChange={(e) => handleInputChange('renavam', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11 font-mono"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="seguro" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Status do Seguro
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status_seguro" className="text-sm font-medium text-gray-700">Status Atual</Label>
                      {mode === 'view' ? (
                        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                          {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                        </div>
                      ) : (
                        <Select 
                          value={formData.status_seguro || 'sem_seguro'} 
                          onValueChange={(value) => handleInputChange('status_seguro', value)}
                        >
                          <SelectTrigger className="h-10 md:h-11">
                            <SelectValue placeholder="Selecione o status do seguro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sem_seguro">Sem Seguro</SelectItem>
                            <SelectItem value="segurado">Segurado</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                            <SelectItem value="vigente">Vigente</SelectItem>
                            <SelectItem value="vence_30_dias">Vence em 30 dias</SelectItem>
                            <SelectItem value="vence_60_dias">Vence em 60 dias</SelectItem>
                            <SelectItem value="cotacao">Em Cotação</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {formData.motivo_sem_seguro && (
                      <div className="space-y-2">
                        <Label htmlFor="motivo_sem_seguro" className="text-sm font-medium text-gray-700">Motivo sem Seguro</Label>
                        {mode === 'view' ? (
                          <p className="p-3 md:p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                            {formData.motivo_sem_seguro}
                          </p>
                        ) : (
                          <Textarea
                            id="motivo_sem_seguro"
                            value={formData.motivo_sem_seguro || ''}
                            onChange={(e) => handleInputChange('motivo_sem_seguro', e.target.value)}
                            rows={3}
                            className="resize-none"
                            placeholder="Descreva o motivo pelo qual o veículo está sem seguro..."
                          />
                        )}
                      </div>
                    )}
                    {mode === 'edit' && formData.status_seguro === 'sem_seguro' && !formData.motivo_sem_seguro && (
                      <div className="space-y-2">
                        <Label htmlFor="motivo_sem_seguro" className="text-sm font-medium text-gray-700">Motivo sem Seguro</Label>
                        <Textarea
                          id="motivo_sem_seguro"
                          value={formData.motivo_sem_seguro || ''}
                          onChange={(e) => handleInputChange('motivo_sem_seguro', e.target.value)}
                          rows={3}
                          className="resize-none"
                          placeholder="Descreva o motivo pelo qual o veículo está sem seguro..."
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="operacao" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    Informações Operacionais
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="observacoes_operacao" className="text-sm font-medium text-gray-700">Observações Operacionais</Label>
                      <Textarea
                        id="observacoes_operacao"
                        value={formData.observacoes_operacao || ''}
                        onChange={(e) => handleInputChange('observacoes_operacao', e.target.value)}
                        disabled={mode === 'view'}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="valores" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      Informações Financeiras
                    </h3>
                    {mode === 'edit' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUpdateFipe}
                        disabled={fipeUpdateLoading}
                        className="text-xs"
                      >
                        {fipeUpdateLoading ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            <span className="hidden sm:inline">Atualizando...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Atualizar FIPE</span>
                            <span className="sm:hidden">FIPE</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preco_nf" className="text-sm font-medium text-gray-700">Valor da Nota Fiscal</Label>
                      <Input
                        id="preco_nf"
                        type="number"
                        value={formData.preco_nf || ''}
                        onChange={(e) => handleInputChange('preco_nf', parseFloat(e.target.value) || null)}
                        disabled={mode === 'view'}
                        className="h-10 md:h-11"
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
                        className="h-10 md:h-11"
                      />
                    </div>
                  </div>
                </Card>

                {formData.preco_fipe && formData.preco_nf && (
                  <Card className="p-3 md:p-6 bg-gray-50">
                    <h4 className="text-sm md:text-md font-semibold mb-3 md:mb-4">Análise FIPE vs Nota Fiscal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-center">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Valor NF</p>
                        <p className="text-sm md:text-lg font-semibold">{formatCurrency(formData.preco_nf)}</p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Diferença</p>
                        <p className={`text-sm md:text-lg font-semibold ${formData.preco_fipe > formData.preco_nf ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(formData.preco_fipe - formData.preco_nf))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">% da Tabela</p>
                        <p className="text-sm md:text-lg font-semibold">
                          {((formData.preco_nf / formData.preco_fipe) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="sinistros" className="mt-0 space-y-4 md:space-y-6">
                <Card className="p-3 md:p-6">
                  <div className="text-center py-6 md:py-8">
                    <AlertTriangle className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                      Sinistros do Veículo
                    </h3>
                    <p className="text-sm md:text-base text-gray-500 mb-4">
                      Lista de sinistros relacionados a este veículo será implementada aqui.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between items-center gap-2 pt-3 md:pt-4 border-t px-4 pb-4">
          <div>
            {mode === 'view' && (
              <Button 
                variant="outline" 
                size="sm"
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
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs md:text-sm"
              >
                <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Editar Veículo</span>
                <span className="sm:hidden">Editar</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs md:text-sm">
              {mode === 'edit' ? 'Cancelar' : 'Fechar'}
            </Button>
            {mode === 'edit' && (
              <Button onClick={handleSave} disabled={loading} size="sm" className="bg-green-600 hover:bg-green-700 text-xs md:text-sm">
                {loading ? (
                  <>
                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                    <span className="sm:hidden">Salvar</span>
                  </>
                ) : (
                  <>
                    <Car className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Salvar Alterações</span>
                    <span className="sm:hidden">Salvar</span>
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