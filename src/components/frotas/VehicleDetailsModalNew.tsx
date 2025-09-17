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
  Calendar,
  Upload,
  RefreshCw,
  X,
  Eye,
  Edit
} from 'lucide-react';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fipeService } from '@/services/fipeService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VehicleDetailsModalNewProps {
  veiculo: FrotaVeiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'view' | 'edit';
  onSave?: (veiculo: FrotaVeiculo) => void;
  onVehicleUpdated?: () => void;
}

export function VehicleDetailsModalNew({ veiculo, open, onOpenChange, mode = 'view', onSave, onVehicleUpdated }: VehicleDetailsModalNewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('veiculo');
  const [formData, setFormData] = useState<Partial<FrotaVeiculo>>({});
  const [loading, setLoading] = useState(false);
  const [fipeLoading, setFipeLoading] = useState(false);
  const [fipeLastUpdate, setFipeLastUpdate] = useState<string | null>(null);

  // Real-time update of form data when vehicle prop changes
  useEffect(() => {
    if (veiculo && (!formData.id || formData.id !== veiculo.id)) {
      setFormData({ ...veiculo });
      if (veiculo.updated_at) {
        setFipeLastUpdate(veiculo.updated_at);
      }
    }
  }, [veiculo, formData.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateFipe = async () => {
    if (!formData.marca || !formData.modelo) {
      toast({
        title: "Dados insuficientes",
        description: "Marca e modelo são necessários para consulta FIPE",
        variant: "destructive"
      });
      return;
    }

    try {
      setFipeLoading(true);
      const result = await fipeService.getPrice({
        placa: formData.placa,
        marca: formData.marca,
        modelo: formData.modelo,
        ano_modelo: formData.ano_modelo || undefined
      });

      handleInputChange('preco_fipe', result.valor);
      setFipeLastUpdate(result.atualizadoEm);
      
      toast({
        title: "Valor FIPE atualizado",
        description: `Valor: R$ ${result.valor.toLocaleString('pt-BR')}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao consultar FIPE",
        description: error.message || "Não foi possível obter o valor FIPE",
        variant: "destructive"
      });
    } finally {
      setFipeLoading(false);
    }
  };

  const handleSave = async () => {
    if (!veiculo || mode === 'view') return;
    
    setLoading(true);
    try {
      // Update vehicle in database
      const { data: updatedVehicle, error } = await supabase
        .from('frota_veiculos')
        .update({
          marca: formData.marca,
          modelo: formData.modelo,
          ano_modelo: formData.ano_modelo,
          categoria: formData.categoria,
          proprietario_nome: formData.proprietario_nome,
          proprietario_tipo: formData.proprietario_tipo,
          proprietario_doc: formData.proprietario_doc,
          uf_emplacamento: formData.uf_emplacamento,
          data_venc_emplacamento: formData.data_venc_emplacamento,
          status_seguro: formData.status_seguro,
          preco_fipe: formData.preco_fipe,
          preco_nf: formData.preco_nf,
          percentual_tabela: formData.percentual_tabela,
          modalidade_compra: formData.modalidade_compra,
          observacoes: formData.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', veiculo.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Veículo atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
        variant: "default"
      });

      // Update the form data with the saved data
      if (updatedVehicle) {
        setFormData(updatedVehicle);
      }

      // Notify parent component to refresh data
      if (onSave) {
        onSave(updatedVehicle || formData as FrotaVeiculo);
      }

      // Trigger data refresh in the parent component
      if (onVehicleUpdated) {
        onVehicleUpdated();
      }
      
      // Keep modal open but show success message
      // Don't close modal: onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Segurado</Badge>;
      case 'sem_seguro':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Seguro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return null;
    
    const colors = {
      passeio: 'bg-blue-100 text-blue-800 border-blue-200',
      utilitario: 'bg-purple-100 text-purple-800 border-purple-200',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200',
      moto: 'bg-green-100 text-green-800 border-green-200',
      outros: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      passeio: 'Passeio',
      utilitario: 'Utilitário',
      caminhao: 'Caminhão',
      moto: 'Moto',
      outros: 'Outros',
    };

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria}
      </Badge>
    );
  };

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>{formData.marca} {formData.modelo}</span>
                <span className="text-sm font-mono text-muted-foreground">{formData.placa}</span>
                <div className="flex gap-2">
                  {getCategoriaBadge(formData.categoria)}
                  {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualização
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Edit className="h-3 w-3 mr-1" />
                  Editando
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 gap-1">
            <TabsTrigger value="veiculo" className="text-xs md:text-sm">Veículo</TabsTrigger>
            <TabsTrigger value="proprietario" className="text-xs md:text-sm">Proprietário</TabsTrigger>
            <TabsTrigger value="emplacamento" className="text-xs md:text-sm">Emplacamento</TabsTrigger>
            <TabsTrigger value="seguro" className="text-xs md:text-sm">Seguro</TabsTrigger>
            <TabsTrigger value="operacao" className="text-xs md:text-sm">Operação</TabsTrigger>
            <TabsTrigger value="valores" className="text-xs md:text-sm">Valores</TabsTrigger>
            <TabsTrigger value="sinistros" className="text-xs md:text-sm">Sinistros</TabsTrigger>
          </TabsList>

          <TabsContent value="veiculo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={formData.marca || ''}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo || ''}
                  onChange={(e) => handleInputChange('modelo', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="ano_modelo">Ano do Modelo</Label>
                <Input
                  id="ano_modelo"
                  type="number"
                  value={formData.ano_modelo || ''}
                  onChange={(e) => handleInputChange('ano_modelo', parseInt(e.target.value) || null)}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria || ''} 
                  onValueChange={(value) => handleInputChange('categoria', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
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
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proprietario" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proprietario_nome">Nome do Proprietário</Label>
                <Input
                  id="proprietario_nome"
                  value={formData.proprietario_nome || ''}
                  onChange={(e) => handleInputChange('proprietario_nome', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="proprietario_tipo">Tipo</Label>
                <Select 
                  value={formData.proprietario_tipo || ''} 
                  onValueChange={(value) => handleInputChange('proprietario_tipo', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pessoa Física ou Jurídica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proprietario_doc">CPF/CNPJ</Label>
                <Input
                  id="proprietario_doc"
                  value={formData.proprietario_doc || ''}
                  onChange={(e) => handleInputChange('proprietario_doc', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar Documento
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emplacamento" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uf_emplacamento">UF de Emplacamento</Label>
                <Input
                  id="uf_emplacamento"
                  value={formData.uf_emplacamento || ''}
                  onChange={(e) => handleInputChange('uf_emplacamento', e.target.value)}
                  maxLength={2}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="data_venc_emplacamento">Data de Vencimento</Label>
                <Input
                  id="data_venc_emplacamento"
                  type="date"
                  value={formData.data_venc_emplacamento || ''}
                  onChange={(e) => handleInputChange('data_venc_emplacamento', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seguro" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status_seguro">Status do Seguro</Label>
                <Select 
                  value={formData.status_seguro || ''} 
                  onValueChange={(value) => handleInputChange('status_seguro', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status do seguro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="segurado">Segurado</SelectItem>
                    <SelectItem value="sem_seguro">Não Segurado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status_seguro === 'sem_seguro' && (
                <div>
                  <Label htmlFor="motivo_sem_seguro">Motivo da Falta de Seguro *</Label>
                  <Input
                    id="motivo_sem_seguro"
                    value={formData.motivo_sem_seguro || ''}
                    onChange={(e) => handleInputChange('motivo_sem_seguro', e.target.value)}
                    placeholder="Informe o motivo..."
                    required
                    disabled={mode === 'view'}
                  />
                </div>
              )}
            </div>
            {formData.status_seguro === 'sem_seguro' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Atenção: Veículo sem seguro</p>
                  <p>Este veículo não possui cobertura de seguro ativa. Certifique-se de informar o motivo.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="operacao" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="previsao_circulacao">Previsão de Circulação</Label>
                <Input
                  id="previsao_circulacao"
                  type="date"
                  value={formData.previsao_circulacao || ''}
                  onChange={(e) => handleInputChange('previsao_circulacao', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observacoes_operacao">Observações de Operação</Label>
                <Textarea
                  id="observacoes_operacao"
                  value={formData.observacoes_operacao || ''}
                  onChange={(e) => handleInputChange('observacoes_operacao', e.target.value)}
                  rows={3}
                  placeholder="Informações sobre circulação, uso do veículo, etc."
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="valores" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preco_fipe">Valor FIPE</Label>
                <div className="flex gap-2">
                  <Input
                    id="preco_fipe"
                    type="number"
                    step="0.01"
                    value={formData.preco_fipe || ''}
                    onChange={(e) => handleInputChange('preco_fipe', parseFloat(e.target.value) || null)}
                    disabled={mode === 'view'}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleUpdateFipe}
                    disabled={fipeLoading || mode === 'view'}
                    className="flex-shrink-0"
                  >
                    {fipeLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {fipeLastUpdate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizado em: {format(new Date(fipeLastUpdate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="preco_nf">Valor da Nota Fiscal</Label>
                <Input
                  id="preco_nf"
                  type="number"
                  step="0.01"
                  value={formData.preco_nf || ''}
                  onChange={(e) => handleInputChange('preco_nf', parseFloat(e.target.value) || null)}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label htmlFor="percentual_tabela">% da Tabela FIPE</Label>
                <Input
                  id="percentual_tabela"
                  type="number"
                  step="0.01"
                  value={formData.percentual_tabela || ''}
                  onChange={(e) => handleInputChange('percentual_tabela', parseFloat(e.target.value) || null)}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
            
            {formData.preco_fipe && formData.preco_nf && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análise de Valores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor FIPE</p>
                      <p className="font-medium">{formatCurrency(formData.preco_fipe)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor NF</p>
                      <p className="font-medium">{formatCurrency(formData.preco_nf)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Diferença</p>
                      <p className={`font-medium ${formData.preco_fipe > formData.preco_nf ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(formData.preco_fipe - formData.preco_nf))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">% da Tabela</p>
                      <p className="font-medium">
                        {((formData.preco_nf / formData.preco_fipe) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sinistros" className="space-y-4">
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sinistros do Veículo
              </h3>
              <p className="text-gray-500 mb-4">
                Lista de sinistros relacionados a este veículo será implementada aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>

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