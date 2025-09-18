import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Car, 
  Shield, 
  Upload,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Vehicle, Policy, Claim } from '@/types/claims';
import { VehiclesService } from '@/services/vehicles';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';

interface NewClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimCreated: (claim: Claim) => void;
}

export function NewClaimModal({ open, onOpenChange, onClaimCreated }: NewClaimModalProps) {
  const [step, setStep] = useState<'vehicle' | 'details'>('vehicle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: '',
    data_evento: '',
    valor_estimado: '',
    descricao: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchVehicles();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchVehicles = async () => {
    setSearching(true);
    try {
      const results = await VehiclesService.searchVehicles(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar veículos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const selectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLoading(true);
    
    try {
      const policy = await VehiclesService.getPolicyByVehicleId(vehicle.id);
      setRelatedPolicy(policy);
      setStep('details');
    } catch (error) {
      console.error('Error getting policy:', error);
      setRelatedPolicy(null);
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) return;

    if (!formData.tipo || !formData.data_evento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo do sinistro e a data do evento.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const claimData: Partial<Claim> = {
        veiculo: selectedVehicle,
        apolice: relatedPolicy,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : undefined,
        status: 'aberto'
      };

      const newClaim = await ClaimsService.createClaim(claimData);
      
      toast({
        title: "Sinistro criado",
        description: `Ticket ${newClaim.ticket} criado com sucesso.`
      });

      onClaimCreated(newClaim);
      handleClose();
    } catch (error) {
      console.error('Error creating claim:', error);
      toast({
        title: "Erro ao criar sinistro",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('vehicle');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedVehicle(null);
    setRelatedPolicy(null);
    setFormData({
      tipo: '',
      data_evento: '',
      valor_estimado: '',
      descricao: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'vehicle' ? 'Selecionar Veículo' : 'Detalhes do Sinistro'}
          </DialogTitle>
        </DialogHeader>

        {step === 'vehicle' && (
          <div className="space-y-6">
            {/* Vehicle Search */}
            <div className="space-y-4">
              <Label htmlFor="search">Buscar veículo</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Digite placa, chassi, proprietário ou modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Buscando veículos...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Resultados encontrados:</h3>
                {searchResults.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => selectVehicle(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Car className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{vehicle.placa}</span>
                            <Badge variant="outline">
                              {vehicle.proprietario_tipo === 'pf' ? 'PF' : 'PJ'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.marca} {vehicle.modelo}
                          </p>
                          {vehicle.proprietario_nome && (
                            <p className="text-sm text-muted-foreground">
                              Proprietário: {vehicle.proprietario_nome}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum veículo encontrado</p>
                <p className="text-sm">Tente buscar por placa, chassi, proprietário ou modelo</p>
              </div>
            )}
          </div>
        )}

        {step === 'details' && selectedVehicle && (
          <div className="space-y-6">
            {/* Selected Vehicle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Veículo Selecionado</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVehicle.placa} • {selectedVehicle.marca} {selectedVehicle.modelo}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStep('vehicle')}
                >
                  Alterar veículo
                </Button>
              </CardContent>
            </Card>

            {/* Related Policy */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Apólice Relacionada</h3>
                </div>

                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : relatedPolicy ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Apólice encontrada</span>
                    </div>
                    <p className="text-sm">
                      <strong>Número:</strong> {relatedPolicy.numero}
                    </p>
                    <p className="text-sm">
                      <strong>Seguradora:</strong> {relatedPolicy.seguradora}
                    </p>
                    {relatedPolicy.vigencia_inicio && relatedPolicy.vigencia_fim && (
                      <p className="text-sm">
                        <strong>Vigência:</strong> {' '}
                        {new Date(relatedPolicy.vigencia_inicio).toLocaleDateString()} - {' '}
                        {new Date(relatedPolicy.vigencia_fim).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-muted-foreground">
                      Nenhuma apólice vinculada encontrada
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Claim Details Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Dados do Sinistro</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo do Sinistro *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colisao">Colisão</SelectItem>
                      <SelectItem value="roubo_furto">Roubo/Furto</SelectItem>
                      <SelectItem value="incendio">Incêndio</SelectItem>
                      <SelectItem value="danos_terceiros">Danos a Terceiros</SelectItem>
                      <SelectItem value="fenomenos_naturais">Fenômenos Naturais</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_evento">Data do Evento *</Label>
                  <Input
                    id="data_evento"
                    type="date"
                    value={formData.data_evento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="valor_estimado"
                    type="number"
                    placeholder="0,00"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do Ocorrido</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva como ocorreu o sinistro..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Documentos (opcional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos aqui ou clique para enviar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG até 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={creating}>
                {creating ? 'Criando...' : 'Criar Sinistro'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}