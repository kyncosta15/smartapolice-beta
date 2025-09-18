import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Plus, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Vehicle, Policy } from '@/types/claims';
import { VehiclesService } from '@/services/vehicles';
import { ClaimsService } from '@/services/claims';

type NovoTicketModalProps = {
  trigger: React.ReactNode;
  onTicketCreated?: () => void;
};

export function NovoTicketModal({ trigger, onTicketCreated }: NovoTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'veiculo' | 'dados'>('veiculo');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null>(undefined);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  
  // Form state
  const [tipoSinistro, setTipoSinistro] = useState('');
  const [dataEvento, setDataEvento] = useState<Date | undefined>();
  const [valorEstimado, setValorEstimado] = useState('');
  const [gravidade, setGravidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isAssistencia, setIsAssistencia] = useState(false);
  const [tipoAssistencia, setTipoAssistencia] = useState('');
  const [observacoesAssistencia, setObservacoesAssistencia] = useState('');
  const [anexos, setAnexos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Search vehicles
  useEffect(() => {
    const searchVehicles = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const results = await VehiclesService.searchVehicles(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    };

    const timeoutId = setTimeout(searchVehicles, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load related policy when vehicle is selected
  const selectVehicle = async (vehicle: Vehicle) => {
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

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAnexos(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const isFormValid = () => {
    return selectedVehicle && tipoSinistro && dataEvento;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedVehicle || !tipoSinistro || !dataEvento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validate date is not in future
    if (dataEvento > new Date()) {
      toast({
        title: "Data inválida",
        description: "A data do evento não pode ser no futuro.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const claimData = {
        veiculo_id: selectedVehicle.id,
        apolice_id: relatedPolicy?.id,
        tipo: tipoSinistro,
        data_evento: dataEvento.toISOString(),
        valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        gravidade: gravidade || undefined,
        descricao: descricao || undefined,
        is_assistencia: isAssistencia,
        tipo_assistencia: isAssistencia ? tipoAssistencia : undefined,
        observacoes_assistencia: isAssistencia ? observacoesAssistencia : undefined,
        anexos
      };

      const newClaim = await ClaimsService.createClaim(claimData);
      
      toast({
        title: "Ticket criado com sucesso",
        description: `Ticket ${newClaim.ticket} criado com sucesso.`,
      });
      
      handleClose();
      onTicketCreated?.();
      
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro ao criar ticket",
        description: "Ocorreu um erro ao criar o ticket. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setOpen(false);
    setStep('veiculo');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedVehicle(null);
    setRelatedPolicy(undefined);
    setTipoSinistro('');
    setDataEvento(undefined);
    setValorEstimado('');
    setGravidade('');
    setDescricao('');
    setIsAssistencia(false);
    setTipoAssistencia('');
    setObservacoesAssistencia('');
    setAnexos([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Novo Ticket de Sinistro
          </DialogTitle>
        </DialogHeader>

        {step === 'veiculo' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="search-vehicle" className="text-base font-medium">
                Selecionar Veículo *
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-vehicle"
                  placeholder="Buscar por placa, chassi, proprietário ou modelo"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {loadingSearch && (
                <div className="text-sm text-muted-foreground">Buscando veículos...</div>
              )}
              
              {searchResults.length > 0 && (
                <div className="grid gap-3 mt-4">
                  {searchResults.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => selectVehicle(vehicle)}
                      className="p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{vehicle.marca} {vehicle.modelo}</div>
                          <div className="text-sm text-muted-foreground">Placa: {vehicle.placa}</div>
                          {vehicle.chassi && (
                            <div className="text-sm text-muted-foreground">Chassi: {vehicle.chassi}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Proprietário: {vehicle.proprietario_nome}
                          </div>
                        </div>
                        <Badge variant="outline">{vehicle.proprietario_tipo === 'pf' ? 'PF' : 'PJ'}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchQuery.length >= 3 && !loadingSearch && searchResults.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum veículo encontrado para "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'dados' && selectedVehicle && (
          <div className="space-y-6">
            {/* Veículo selecionado */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Veículo Selecionado</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicle.marca} {selectedVehicle.modelo} • {selectedVehicle.placa}
                  </p>
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
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      Apólice encontrada
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p><strong>Número:</strong> {relatedPolicy.numero}</p>
                    <p><strong>Seguradora:</strong> {relatedPolicy.seguradora}</p>
                    {relatedPolicy.vigencia_inicio && relatedPolicy.vigencia_fim && (
                      <p><strong>Vigência:</strong> {format(parseISO(relatedPolicy.vigencia_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(relatedPolicy.vigencia_fim), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Não encontrada
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma apólice foi encontrada para este veículo.
                  </p>
                </div>
              )}
            </div>

            {/* Dados do sinistro */}
            <div className="space-y-4">
              <h3 className="font-medium">Dados do Sinistro</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-sinistro">Tipo do Sinistro *</Label>
                  <Select value={tipoSinistro} onValueChange={setTipoSinistro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colisao">Colisão</SelectItem>
                      <SelectItem value="roubo_furto">Roubo/Furto</SelectItem>
                      <SelectItem value="incendio">Incêndio</SelectItem>
                      <SelectItem value="enchente">Enchente</SelectItem>
                      <SelectItem value="vandalismo">Vandalismo</SelectItem>
                      <SelectItem value="danos_terceiros">Danos a Terceiros</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
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
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-estimado">Valor Estimado (R$)</Label>
                  <Input
                    id="valor-estimado"
                    placeholder="0,00"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gravidade">Gravidade</Label>
                  <Select value={gravidade} onValueChange={setGravidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a gravidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o ocorrido..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Toggle assistência */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Switch 
                  id="is-assistencia" 
                  checked={isAssistencia} 
                  onCheckedChange={setIsAssistencia} 
                />
                <Label htmlFor="is-assistencia" className="cursor-pointer">
                  Este caso também envolve assistência?
                </Label>
              </div>

              {/* Campos de assistência */}
              {isAssistencia && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium">Dados da Assistência</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo-assistencia">Tipo de Assistência</Label>
                      <Select value={tipoAssistencia} onValueChange={setTipoAssistencia}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guincho">Guincho</SelectItem>
                          <SelectItem value="vidro">Vidro</SelectItem>
                          <SelectItem value="residencia">Residência</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observacoes-assistencia">Observações da Assistência</Label>
                    <Textarea
                      id="observacoes-assistencia"
                      placeholder="Observações específicas da assistência..."
                      value={observacoesAssistencia}
                      onChange={(e) => setObservacoesAssistencia(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Upload de documentos */}
              <div className="space-y-4">
                <Label>Documentos</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2">
                      <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                        Clique para fazer upload
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        BO, fotos, laudos, CRLV (PDF, JPG, PNG, DOC)
                      </p>
                    </div>
                  </div>
                </div>

                {anexos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Arquivos selecionados:</p>
                    {anexos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button variant="secondary" disabled={!isFormValid()}>
                  Salvar Rascunho
                </Button>
              </div>
              
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
      </DialogContent>
    </Dialog>
  );
}