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
  Landmark,
  Settings,
  Calendar,
  Upload,
  RefreshCw,
  X,
  Eye,
  Edit,
  Wrench,
  Clock,
  ExternalLink,
  ShieldAlert,
  HardHat
} from 'lucide-react';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fipeService } from '@/services/fipeService';
import { VehicleDocumentsSection } from './VehicleDocumentsSection';
import { VehicleFinanceTab } from './VehicleFinanceTab';
import { VehicleTheftSection } from './VehicleTheftSection';
import VehicleMaintenanceModule from './maintenance/VehicleMaintenanceModule';
import TachographTab from './tachograph/TachographTab';
import VehicleAssignmentTab from './VehicleAssignmentTab';
import { Ticket } from '@/types/tickets';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface VehicleDetailsModalNewProps {
  veiculo: FrotaVeiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedVeiculo: FrotaVeiculo) => void;
  mode?: 'view' | 'edit';
  defaultTab?: string;
}

export function VehicleDetailsModalNew({ 
  veiculo, 
  open, 
  onOpenChange, 
  onSave,
  mode = 'view',
  defaultTab = 'veiculo'
}: VehicleDetailsModalNewProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState<Partial<FrotaVeiculo>>({});
  const [loading, setLoading] = useState(false);
  const [fipeUpdateLoading, setFipeUpdateLoading] = useState(false);
  const [fipeUpdateInfo, setFipeUpdateInfo] = useState<{
    updated: boolean;
    oldValue?: number;
    newValue?: number;
  }>({ updated: false });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (veiculo) {
      setFormData({ ...veiculo });
      setFipeUpdateInfo({ updated: false });
      loadVehicleTickets(veiculo.id);
    }
  }, [veiculo]);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const loadVehicleTickets = async (vehicleId: string) => {
    console.log('🚗 Carregando tickets para veículo:', vehicleId);
    setTicketsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na query de tickets:', error);
        throw error;
      }

      console.log('📊 Tickets encontrados:', data?.length, data);

      const mappedTickets = (data || []).map(ticket => {
        const payload = ticket.payload as any;
        return {
          ...ticket,
          descricao: payload?.descricao,
          gravidade: payload?.gravidade,
        };
      }) as Ticket[];

      console.log('✅ Tickets mapeados:', mappedTickets.length);
      setTickets(mappedTickets);
    } catch (error) {
      console.error('❌ Erro ao carregar tickets do veículo:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

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
    
    // Extract only the fields that belong to frota_veiculos table
    const {
      responsaveis,
      pagamentos,
      documentos,
      ...vehicleData
    } = formData;
    
    try {
      const { error } = await supabase
        .from('frota_veiculos')
        .update(vehicleData)
        .eq('id', formData.id);

      if (error) throw error;

      if (onSave) {
        onSave(formData as FrotaVeiculo);
      }

      toast.success('Veículo atualizado com sucesso!');
      
      // Dispatch events to refresh the table and dashboard data
      window.dispatchEvent(new CustomEvent('vehicleUpdated'));
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      console.error('Dados que tentou salvar:', vehicleData);
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Não mostrar badge para status "sem_seguro"
    if (status === 'sem_seguro') {
      return null;
    }
    
    const config = {
      'vigente': { color: 'bg-green-100 text-green-800', label: 'Vigente' },
      'vencido': { color: 'bg-red-100 text-red-800', label: 'Vencido' },
      'vence_30_dias': { color: 'bg-yellow-100 text-yellow-800', label: 'Vence em 30 dias' },
      'vence_60_dias': { color: 'bg-blue-100 text-blue-800', label: 'Vence em 60 dias' }
    };
    
    const statusConfig = config[status as keyof typeof config];
    
    if (!statusConfig) {
      return null;
    }
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getCategoriaBadge = (categoria: string) => {
    const labels = {
      'Carros': 'Carros',
      'Caminhão': 'Caminhão',
      'Moto': 'Moto',
      'Lanchas': 'Lanchas'
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

  const isTruck = !!(formData.categoria && ['Caminhão', 'caminhao', 'CAMINHAO'].includes(formData.categoria));

  if (!veiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="shrink-0 pb-4 px-6 pt-5 border-b bg-gradient-to-b from-muted/30 to-background">
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
              <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate leading-tight">
                  {formData.marca} {formData.modelo}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span className="font-mono font-medium text-foreground/80 bg-muted px-2 py-0.5 rounded text-xs">
                    {formData.placa || '—'}
                  </span>
                  {formData.ano_modelo && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{formData.ano_modelo}</span>
                    </>
                  )}
                  {formData.categoria && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{formData.categoria}</span>
                    </>
                  )}
                  {formData.funcao && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{formData.funcao}</span>
                    </>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                  {getStatusBadge(formData.status_seguro || 'sem_seguro')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 mr-8">
              {tickets.length > 0 && mode === 'view' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('sinistros')}
                  className="h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full text-xs font-medium"
                  title="Ver ocorrências"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">{tickets.length} ocorrência{tickets.length > 1 ? 's' : ''}</span>
                </Button>
              )}
              {mode === 'view' ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (onSave) {
                      onOpenChange(false);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('editVehicle', { detail: veiculo?.id }));
                      }, 100);
                    }
                  }}
                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                  title="Editar veículo"
                >
                  <Edit className="h-4 w-4" />
                </Button>
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
            <div className="shrink-0 px-4 md:px-6 pt-3 pb-1 overflow-x-auto border-b">
              <TabsList className="flex md:inline-flex gap-1 h-auto p-0 bg-transparent w-full md:w-auto min-w-max">
                {[
                  { value: 'veiculo', icon: Car, label: 'Info' },
                  { value: 'proprietario', icon: User, label: 'Dono' },
                  { value: 'emplacamento', icon: FileText, label: 'Docs' },
                  { value: 'seguro', icon: Shield, label: 'Seguro' },
                  { value: 'operacao', icon: Settings, label: 'Operação' },
                  { value: 'valores', icon: DollarSign, label: 'Valores' },
                  { value: 'financeiro', icon: Landmark, label: 'Financeiro' },
                  { value: 'sinistros', icon: AlertTriangle, label: 'Sinistros' },
                  { value: 'roubo', icon: ShieldAlert, label: 'Roubo' },
                  { value: 'alocacao', icon: HardHat, label: 'Obra' },
                  ...(isTruck ? [{ value: 'tacografo', icon: Clock, label: 'Tacógrafo' }] : []),
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="relative data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 rounded-full px-3.5 py-2 text-xs whitespace-nowrap flex-shrink-0 border-0"
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 bg-muted/20">
              <TabsContent value="veiculo" className="mt-0 space-y-5">
                {/* Bloco: Identificação */}
                <div className="bg-card rounded-2xl border border-border/60 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        Identificação
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Marca, modelo e ano do veículo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="marca" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Marca</Label>
                      <Input
                        id="marca"
                        value={formData.marca || ''}
                        onChange={(e) => handleInputChange('marca', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="modelo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo || ''}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ano_modelo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ano do Modelo</Label>
                      <Input
                        id="ano_modelo"
                        type="number"
                        value={formData.ano_modelo || ''}
                        onChange={(e) => handleInputChange('ano_modelo', parseInt(e.target.value) || null)}
                        disabled={mode === 'view'}
                        className="h-12 border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco: Documentação */}
                <div className="bg-card rounded-2xl border border-border/60 p-5 md:p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Documentação
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Placa, RENAVAM, chassi e código FIPE</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="placa" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Placa</Label>
                      <Input
                        id="placa"
                        value={formData.placa || ''}
                        onChange={(e) => handleInputChange('placa', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 font-mono border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="renavam" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">RENAVAM</Label>
                      <Input
                        id="renavam"
                        value={formData.renavam || ''}
                        onChange={(e) => handleInputChange('renavam', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 font-mono border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="chassi" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chassi</Label>
                      <Input
                        id="chassi"
                        value={formData.chassi || ''}
                        onChange={(e) => handleInputChange('chassi', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 font-mono border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="codigo_fipe" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Código FIPE</Label>
                      <Input
                        id="codigo_fipe"
                        value={formData.codigo_fipe || formData.codigo || ''}
                        onChange={(e) => handleInputChange('codigo_fipe', e.target.value)}
                        disabled={mode === 'view'}
                        className="h-12 font-mono border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                        placeholder="Ex: 021601-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco: Classificação */}
                <div className="bg-card rounded-2xl border border-border/60 p-5 md:p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Classificação
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Categoria, função e localização</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="categoria" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria (FIPE)</Label>
                      <Select
                        value={formData.categoria || ''}
                        onValueChange={(value) => handleInputChange('categoria', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-12 border-border/60 bg-background focus:ring-primary/30">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Carros">Carros</SelectItem>
                          <SelectItem value="Caminhão">Caminhão</SelectItem>
                          <SelectItem value="Moto">Moto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="funcao" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Função</Label>
                      <Select
                        value={formData.funcao || ''}
                        onValueChange={(value) => handleInputChange('funcao', value)}
                        disabled={mode === 'view'}
                      >
                        <SelectTrigger className="h-12 border-border/60 bg-background focus:ring-primary/30">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passeio">Passeio</SelectItem>
                          <SelectItem value="Utilitário">Utilitário</SelectItem>
                          <SelectItem value="Carga">Carga</SelectItem>
                          <SelectItem value="Transporte">Transporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="localizacao" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Localização</Label>
                      <Input
                        id="localizacao"
                        value={formData.localizacao || ''}
                        onChange={(e) => handleInputChange('localizacao', e.target.value)}
                        disabled={mode === 'view'}
                        placeholder="Cidade ou base"
                        className="h-12 border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco: Origem & Observações (collapsible) */}
                <details className="group bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-muted/40 transition-colors list-none">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Origem & Observações
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Informações complementares e notas internas</p>
                    </div>
                    <div className="text-muted-foreground transition-transform group-open:rotate-180">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </summary>
                  <div className="px-5 md:px-6 pb-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="origem_planilha" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Origem da Planilha</Label>
                      <Input
                        id="origem_planilha"
                        value={formData.origem_planilha || ''}
                        onChange={(e) => handleInputChange('origem_planilha', e.target.value)}
                        disabled={mode === 'view'}
                        placeholder="Ex: importação 2024-01"
                        className="h-12 border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="observacoes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes || ''}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        disabled={mode === 'view'}
                        rows={3}
                        placeholder="Notas internas sobre o veículo"
                        className="resize-none border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                </details>
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
                          <SelectItem value="pf">Pessoa Física</SelectItem>
                          <SelectItem value="pj">Pessoa Jurídica</SelectItem>
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
                <VehicleDocumentsSection
                  vehicleId={veiculo?.id || formData.id || ''}
                  mode={mode}
                  vehiclePlaca={veiculo?.placa || formData.placa}
                  vehicleChassi={veiculo?.chassi || formData.chassi}
                  initialDocuments={veiculo?.documentos || formData.documentos || []}
                />
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

                {activeTab === 'operacao' && (
                  <VehicleMaintenanceModule
                    vehicleId={veiculo.id}
                  />
                )}
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

              <TabsContent value="financeiro" className="mt-0 space-y-4 md:space-y-6">
                <VehicleFinanceTab
                  vehicleId={veiculo.id}
                  empresaId={veiculo.empresa_id}
                  fipeAtual={formData.preco_fipe}
                  mode={mode}
                />
              </TabsContent>

              <TabsContent value="sinistros" className="mt-0 space-y-4 md:space-y-6">
                <div className="p-3 md:p-6">
                  {ticketsLoading ? (
                    <Card className="p-6">
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Carregando...</span>
                      </div>
                    </Card>
                  ) : tickets.length === 0 ? (
                    <Card className="p-6">
                      <div className="text-center py-8">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhum registro encontrado
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Este veículo não possui sinistros ou assistências registrados.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Histórico de Ocorrências
                        </h3>
                        <Badge variant="secondary">
                          {tickets.length} registro(s)
                        </Badge>
                      </div>

                      {tickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                ticket.tipo === 'sinistro' 
                                  ? "bg-red-100 text-red-600" 
                                  : "bg-blue-100 text-blue-600"
                              )}>
                                {ticket.tipo === 'sinistro' ? (
                                  <AlertTriangle className="h-5 w-5" />
                                ) : (
                                  <Wrench className="h-5 w-5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 pr-8">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-sm md:text-base capitalize">
                                      {ticket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'}
                                      {ticket.subtipo && ` - ${ticket.subtipo.replace('_', ' ')}`}
                                      {ticket.protocol_code && (
                                        <span className="text-xs text-muted-foreground font-normal ml-2">
                                          • {ticket.protocol_code}
                                        </span>
                                      )}
                                    </h4>
                                  </div>
                                  <Badge 
                                    variant={
                                      ticket.status === 'finalizado' ? 'default' :
                                      ticket.status === 'cancelado' ? 'destructive' :
                                      ticket.status === 'em_analise' ? 'secondary' :
                                      'outline'
                                    }
                                    className="shrink-0"
                                  >
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                </div>

                                {ticket.descricao && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {ticket.descricao}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {ticket.data_evento && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(ticket.data_evento), 'dd/MM/yyyy', { locale: ptBR })}
                                    </div>
                                  )}
                                  {ticket.valor_estimado && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(ticket.valor_estimado)}
                                    </div>
                                  )}
                                  {ticket.localizacao && (
                                    <div className="flex items-center gap-1 truncate">
                                      📍 {ticket.localizacao}
                                    </div>
                                  )}
                                </div>

                                {ticket.gravidade && ticket.tipo === 'sinistro' && (
                                  <div className="mt-2">
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        ticket.gravidade === 'critica' && "border-red-500 text-red-700",
                                        ticket.gravidade === 'alta' && "border-orange-500 text-orange-700",
                                        ticket.gravidade === 'media' && "border-yellow-500 text-yellow-700",
                                        ticket.gravidade === 'baixa' && "border-green-500 text-green-700"
                                      )}
                                    >
                                      Gravidade: {ticket.gravidade}
                                    </Badge>
                                  </div>
                                )}

                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                  <Clock className="h-3 w-3" />
                                  Criado em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="roubo" className="mt-0 space-y-4 md:space-y-6">
                <VehicleTheftSection
                  vehicleId={veiculo.id}
                  empresaId={veiculo.empresa_id}
                  isStolen={(veiculo as any).is_stolen_current || false}
                  stolenDate={(veiculo as any).stolen_current_date || null}
                  mode={mode}
                  onUpdate={() => window.dispatchEvent(new Event('frota-data-updated'))}
                />
              </TabsContent>

              <TabsContent value="alocacao" className="mt-0 space-y-4 md:space-y-6">
                <VehicleAssignmentTab
                  vehicleId={veiculo.id}
                  currentResponsible={(veiculo as any).current_responsible_name}
                  currentWorksite={(veiculo as any).current_worksite_name}
                  currentWorksiteStartDate={(veiculo as any).current_worksite_start_date}
                  mode={mode}
                  onAssignmentSaved={() => window.dispatchEvent(new Event('frota-data-updated'))}
                />
              </TabsContent>

              {isTruck && activeTab === 'tacografo' && (
                <TabsContent value="tacografo" className="mt-0 space-y-4 md:space-y-6" forceMount>
                  <TachographTab vehicleId={veiculo.id} />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end items-center gap-2 pt-3 md:pt-4 border-t px-4 pb-4">
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