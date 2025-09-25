import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Plus, CheckCircle, AlertTriangle, Car, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Vehicle, Policy } from '@/types/claims';
import { VehiclesService } from '@/services/vehicles';
import { ClaimsService } from '@/services/claims';

type NovoTicketModalProps = {
  trigger: React.ReactNode;
  onTicketCreated?: () => void;
  initialTipo?: 'sinistro' | 'assistencia';
};

export function NovoTicketModal({ trigger, onTicketCreated, initialTipo = 'sinistro' }: NovoTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'veiculo' | 'dados'>('veiculo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null>(undefined);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Carregar veículos apenas quando o modal abrir
  useEffect(() => {
    if (open && veiculos.length === 0) {
      loadVehicles();
    }
  }, [open]);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('frota_veiculos')
        .select(`
          id,
          placa,
          chassi,
          marca,
          modelo,
          proprietario_nome,
          proprietario_tipo,
          status_seguro
        `)
        .order('placa');
      
      if (data) {
        setVeiculos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };
  
  // Form state
  const [tipoTicket, setTipoTicket] = useState<'sinistro' | 'assistencia'>(initialTipo);
  const [tipoSinistro, setTipoSinistro] = useState('');
  const [tipoAssistencia, setTipoAssistencia] = useState('');
  const [dataEvento, setDataEvento] = useState<Date | undefined>();
  const [valorEstimado, setValorEstimado] = useState('');
  const [gravidade, setGravidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anexos, setAnexos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Filtrar veículos baseado na busca
  const filteredVehicles = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return veiculos;
    
    const query = searchQuery.toLowerCase();
    return veiculos.filter(veiculo =>
      veiculo.placa?.toLowerCase().includes(query) ||
      veiculo.marca?.toLowerCase().includes(query) ||
      veiculo.modelo?.toLowerCase().includes(query) ||
      veiculo.proprietario_nome?.toLowerCase().includes(query) ||
      veiculo.chassi?.toLowerCase().includes(query)
    );
  }, [veiculos, searchQuery]);

  // Converter veículo da frota para o formato esperado pelo modal
  const convertVehicle = (veiculo: any): Vehicle => ({
    id: veiculo.id,
    placa: veiculo.placa,
    chassi: veiculo.chassi,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    proprietario_nome: veiculo.proprietario_nome,
    proprietario_tipo: veiculo.proprietario_tipo
  });

  const selectVehicle = async (veiculo: any) => {
    const vehicle = convertVehicle(veiculo);
    setSelectedVehicle(vehicle);
    setLoadingPolicy(true);
    
    try {
      const policy = await VehiclesService.getPolicyByVehicleId(vehicle.id);
      setRelatedPolicy(policy);
    } catch (error) {
      console.error('Erro ao buscar apólice:', error);
      setRelatedPolicy(null);
    } finally {
      setLoadingPolicy(false);
    }
    
    setStep('dados');
  };

  const handleSubmit = async () => {
    const currentTipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia;
    if (!selectedVehicle || !currentTipo || !dataEvento) return;

    try {
      setSubmitting(true);

      const claimData = {
        veiculo_id: selectedVehicle.id,
        apolice_id: relatedPolicy?.id,
        tipo: currentTipo,
        data_evento: format(dataEvento, 'yyyy-MM-dd'),
        valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        gravidade: tipoTicket === 'sinistro' ? gravidade : undefined,
        descricao,
        is_assistencia: tipoTicket === 'assistencia',
        tipo_assistencia: tipoTicket === 'assistencia' ? tipoAssistencia : undefined,
        anexos: anexos
      };

      await ClaimsService.createClaim(claimData);

      toast({
        title: "Ticket criado com sucesso!",
        description: "O ticket foi registrado e está em análise.",
      });

      handleClose();
      onTicketCreated?.();

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro ao criar ticket",
        description: "Não foi possível criar o ticket. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    const currentTipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia;
    return selectedVehicle && currentTipo && dataEvento;
  };

  const handleClose = () => {
    setOpen(false);
    setStep('veiculo');
    setSearchQuery('');
    setSelectedVehicle(null);
    setRelatedPolicy(undefined);
    setTipoTicket(initialTipo);
    setTipoSinistro('');
    setTipoAssistencia('');
    setDataEvento(undefined);
    setValorEstimado('');
    setGravidade('');
    setDescricao('');
    setAnexos([]);
    setSubmitting(false);
    // Limpar lista de veículos para recarregar na próxima abertura
    setVeiculos([]);
  };

  const canSubmit = selectedVehicle && (tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia) && dataEvento;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipoTicket === 'sinistro' ? (
              <Car className="h-5 w-5 text-red-600" />
            ) : (
              <Wrench className="h-5 w-5 text-blue-600" />
            )}
            Novo Ticket - {tipoTicket === 'sinistro' ? 'Sinistro' : 'Assistência'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'veiculo' && (
            <div className="space-y-4">
              <div>
                <Label>Selecionar Veículo *</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa, chassi, proprietário ou modelo"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loadingVehicles && (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando veículos...
                </div>
              )}

              {!loadingVehicles && filteredVehicles.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredVehicles.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => selectVehicle(veiculo)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{veiculo.placa}</div>
                          <div className="text-sm text-muted-foreground">
                            {veiculo.marca} {veiculo.modelo} • {veiculo.proprietario_nome || 'N/A'}
                          </div>
                          {veiculo.status_seguro && (
                            <Badge 
                              variant={veiculo.status_seguro === 'com_seguro' ? 'default' : 'secondary'}
                              className="mt-1 text-xs"
                            >
                              {veiculo.status_seguro === 'com_seguro' ? 'Com Seguro' : 'Sem Seguro'}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">Veículo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingVehicles && searchQuery && searchQuery.length >= 2 && filteredVehicles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">Nenhum veículo encontrado</div>
                  <div className="text-sm">Tente buscar por placa, chassi, marca ou proprietário</div>
                </div>
              )}

              {!loadingVehicles && !searchQuery && veiculos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">Nenhum veículo cadastrado</div>
                  <div className="text-sm">Cadastre veículos na gestão de frotas primeiro</div>
                </div>
              )}
            </div>
          )}

          {step === 'dados' && selectedVehicle && (
            <div className="space-y-6">
              {/* Veículo selecionado */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Veículo Selecionado</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedVehicle.marca} {selectedVehicle.modelo} • {selectedVehicle.placa}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('veiculo')}
                    className="text-primary"
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              {/* Apólice relacionada */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3">Apólice Relacionada</h3>
                {loadingPolicy ? (
                  <div className="text-sm text-muted-foreground">Buscando apólice...</div>
                ) : relatedPolicy ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                        Apólice encontrada
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Número:</strong> {relatedPolicy.numero}</div>
                      <div><strong>Seguradora:</strong> {relatedPolicy.seguradora}</div>
                      <div><strong>Vigência:</strong> {relatedPolicy.vigencia_inicio} - {relatedPolicy.vigencia_fim}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Não encontrada
                    </Badge>
                  </div>
                )}
              </div>

              {/* Seleção do tipo de ticket */}
              <div>
                <Label>Tipo de Ticket *</Label>
                <Tabs value={tipoTicket} onValueChange={(value: string) => setTipoTicket(value as 'sinistro' | 'assistencia')} className="w-full mt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sinistro" className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Sinistro
                    </TabsTrigger>
                    <TabsTrigger value="assistencia" className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Assistência
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Dados específicos do tipo */}
              <div className="space-y-4">
                <h3 className="font-medium">
                  {tipoTicket === 'sinistro' ? 'Dados do Sinistro' : 'Dados da Assistência'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      {tipoTicket === 'sinistro' ? 'Tipo do Sinistro *' : 'Tipo de Assistência *'}
                    </Label>
                    {tipoTicket === 'sinistro' ? (
                      <Select value={tipoSinistro} onValueChange={setTipoSinistro}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="colisao">Colisão</SelectItem>
                          <SelectItem value="roubo">Roubo</SelectItem>
                          <SelectItem value="furto">Furto</SelectItem>
                          <SelectItem value="avaria">Avaria</SelectItem>
                          <SelectItem value="incendio">Incêndio</SelectItem>
                          <SelectItem value="danos_terceiros">Danos a Terceiros</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={tipoAssistencia} onValueChange={setTipoAssistencia}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guincho">Guincho</SelectItem>
                          <SelectItem value="vidro">Vidro</SelectItem>
                          <SelectItem value="mecanica">Mecânica</SelectItem>
                          <SelectItem value="chaveiro">Chaveiro</SelectItem>
                          <SelectItem value="pneu">Pneu</SelectItem>
                          <SelectItem value="combustivel">Combustível</SelectItem>
                          <SelectItem value="residencia">Residência</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label>Data do Evento *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataEvento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataEvento ? format(dataEvento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataEvento}
                          onSelect={setDataEvento}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {tipoTicket === 'sinistro' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Estimado (R$)</Label>
                      <Input
                        placeholder="Ex: 5.000,00"
                        value={valorEstimado}
                        onChange={(e) => setValorEstimado(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Gravidade</Label>
                      <Select value={gravidade} onValueChange={setGravidade}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a gravidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Descrição/Observações</Label>
                  <Textarea
                    placeholder="Descreva o ocorrido com detalhes..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!isFormValid() || submitting}
                  className="min-w-32"
                >
                  {submitting ? "Criando..." : "Abrir Ticket"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}