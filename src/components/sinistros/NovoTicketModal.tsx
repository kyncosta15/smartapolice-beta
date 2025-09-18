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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Search, Plus, Upload, X, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  
  const { toast } = useToast();

  // Search vehicles
  useEffect(() => {
    if (open && searchQuery && searchQuery.length >= 3) {
      searchVehicles();
    }
  }, [searchQuery, open]);

  const searchVehicles = async () => {
    try {
      setLoadingSearch(true);
      const results = await VehiclesService.searchVehicles(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast({
        title: "Erro ao buscar veículos",
        description: "Tente novamente com outros termos.",
        variant: "destructive"
      });
    } finally {
      setLoadingSearch(false);
    }
  };

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

  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    setPdfFile(file);
    setExtractingPdf(true);

    try {
      // Simulate PDF extraction - replace with actual PDF parsing service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockExtractedData = {
        veiculo: {
          placa: 'ABC1234',
          marca: 'FIAT', 
          modelo: 'ARGO',
          chassi: '9BD15906JM1234567'
        },
        evento: {
          tipo: 'COLISAO',
          data: '2025-01-15',
          descricao: 'Colisão traseira em semáforo, danos na parte frontal do veículo.',
          valor_estimado: '5000'
        }
      };
      
      setExtractedData(mockExtractedData);
      
      // Auto-fill form with extracted data
      setSearchQuery(mockExtractedData.veiculo.placa);
      setTipoSinistro(mockExtractedData.evento.tipo);
      setDataEvento(new Date(mockExtractedData.evento.data));
      setValorEstimado(mockExtractedData.evento.valor_estimado);
      setDescricao(mockExtractedData.evento.descricao);
      
      toast({
        title: "PDF processado",
        description: "Dados extraídos e preenchidos automaticamente.",
      });
      
    } catch (error) {
      console.error('Erro ao extrair dados do PDF:', error);
      toast({
        title: "Erro ao processar PDF",
        description: "Não foi possível extrair os dados. Preencha manualmente.",
        variant: "destructive"
      });
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !tipoSinistro || !dataEvento) return;

    try {
      setSubmitting(true);

      const claimData = {
        veiculo_id: selectedVehicle.id,
        apolice_id: relatedPolicy?.id,
        tipo: tipoSinistro,
        data_evento: format(dataEvento, 'yyyy-MM-dd'),
        valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        gravidade,
        descricao,
        is_assistencia: isAssistencia,
        tipo_assistencia: isAssistencia ? tipoAssistencia : undefined,
        observacoes_assistencia: isAssistencia ? observacoesAssistencia : undefined,
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

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setAnexos(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    return selectedVehicle && tipoSinistro && dataEvento;
  };

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
    setSubmitting(false);
    setPdfFile(null);
    setExtractedData(null);
    setExtractingPdf(false);
  };

  const canSubmit = selectedVehicle && tipoSinistro && dataEvento;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Novo Ticket de Sinistro
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Preenchimento Manual</TabsTrigger>
            <TabsTrigger value="pdf">Importar do PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Importar dados do PDF</h3>
                <p className="text-muted-foreground">Faça upload do PDF do sinistro para extrair automaticamente as informações</p>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfUpload(file);
                  }}
                  disabled={extractingPdf}
                />
                {extractingPdf && (
                  <p className="text-sm text-muted-foreground">Processando PDF...</p>
                )}
              </div>

              {extractedData && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <h4 className="font-medium mb-2">Dados extraídos:</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Veículo:</strong> {extractedData.veiculo.marca} {extractedData.veiculo.modelo} - {extractedData.veiculo.placa}</p>
                    <p><strong>Tipo:</strong> {extractedData.evento.tipo}</p>
                    <p><strong>Data:</strong> {extractedData.evento.data}</p>
                    <p><strong>Valor estimado:</strong> R$ {extractedData.evento.valor_estimado}</p>
                  </div>
                  <Button 
                    className="mt-3" 
                    onClick={() => {
                      // Switch to manual tab with pre-filled data
                      (document.querySelector('[value="manual"]') as HTMLElement)?.click();
                    }}
                  >
                    Continuar com estes dados
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
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

                {loadingSearch && (
                  <div className="text-center py-4 text-muted-foreground">
                    Buscando veículos...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => selectVehicle(vehicle)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{vehicle.placa}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.marca} {vehicle.modelo} • {vehicle.proprietario_nome || 'N/A'}
                            </div>
                          </div>
                          <Badge variant="outline">Veículo</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchQuery.length >= 3 && !loadingSearch && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-lg font-medium mb-2">Nenhum veículo encontrado</div>
                    <div className="text-sm">Tente buscar por placa, chassi ou proprietário</div>
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

                {/* Dados do sinistro */}
                <div className="space-y-4">
                  <h3 className="font-medium">Dados do Sinistro</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo do Sinistro *</Label>
                      <Select value={tipoSinistro} onValueChange={setTipoSinistro}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COLISAO">Colisão</SelectItem>
                          <SelectItem value="ROUBO_FURTO">Roubo/Furto</SelectItem>
                          <SelectItem value="INCENDIO">Incêndio</SelectItem>
                          <SelectItem value="DANOS_NATURAIS">Danos Naturais</SelectItem>
                          <SelectItem value="VIDROS">Vidros</SelectItem>
                          <SelectItem value="OUTROS">Outros</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Descrição do Ocorrido</Label>
                    <Textarea
                      placeholder="Descreva como ocorreu o sinistro..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Toggle Assistência */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assistencia"
                      checked={isAssistencia}
                      onCheckedChange={setIsAssistencia}
                    />
                    <Label htmlFor="assistencia">Este sinistro requer assistência?</Label>
                  </div>

                  {isAssistencia && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label>Tipo de Assistência</Label>
                        <Select value={tipoAssistencia} onValueChange={setTipoAssistencia}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GUINCHO">Guincho</SelectItem>
                            <SelectItem value="CHAVEIRO">Chaveiro</SelectItem>
                            <SelectItem value="PNEU_ESTEPE">Pneu/Estepe</SelectItem>
                            <SelectItem value="COMBUSTIVEL">Combustível</SelectItem>
                            <SelectItem value="BATERIA">Bateria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Observações da Assistência</Label>
                        <Textarea
                          placeholder="Detalhes sobre a assistência..."
                          value={observacoesAssistencia}
                          onChange={(e) => setObservacoesAssistencia(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload de documentos */}
                <div className="space-y-4">
                  <h3 className="font-medium">Documentos</h3>
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground mb-2">
                        Faça upload dos documentos (BO, fotos, laudos, CRLV)
                      </div>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  </div>

                  {anexos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Arquivos selecionados:</Label>
                      {anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}