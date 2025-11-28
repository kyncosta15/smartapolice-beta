import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useUserProfile } from '@/hooks/useUserProfile'
import { DialogRCorp } from '@/components/ui-v2/dialog-rcorp'
import { ComboboxRCorp, type ComboboxItem } from '@/components/ui-v2/combobox-rcorp'
import { DatePickerRCorp } from '@/components/ui-v2/datepicker-rcorp'
import { CheckCircle, AlertTriangle, Car, Wrench, Search, UserPlus } from 'lucide-react'
import { today, getLocalTimeZone } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { Vehicle, Policy } from '@/types/claims'
import { VehiclesService } from '@/services/vehicles'
import { SeguradosService, type Segurado } from '@/services/segurados'
import { supabase } from '@/integrations/supabase/client'

// Tipos de sinistro e assistência como dados constantes
const TIPOS_SINISTRO: ComboboxItem[] = [
  { id: 'colisao', label: 'Colisão' },
  { id: 'roubo', label: 'Roubo' },
  { id: 'furto', label: 'Furto' },
  { id: 'avaria', label: 'Avaria' },
  { id: 'incendio', label: 'Incêndio' },
  { id: 'danos_terceiros', label: 'Danos a Terceiros' },
]

const TIPOS_ASSISTENCIA: ComboboxItem[] = [
  { id: 'guincho', label: 'Guincho' },
  { id: 'vidro', label: 'Vidro' },
  { id: 'mecanica', label: 'Mecânica' },
  { id: 'chaveiro', label: 'Chaveiro' },
  { id: 'pneu', label: 'Pneu' },
  { id: 'combustivel', label: 'Combustível' },
  { id: 'residencia', label: 'Residência' },
]

const NIVEIS_GRAVIDADE: ComboboxItem[] = [
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
  { id: 'critica', label: 'Crítica' },
]

type NovoTicketModalV4Props = {
  trigger: React.ReactNode
  onTicketCreated?: () => void
  initialTipo?: 'sinistro' | 'assistencia'
}

export function NovoTicketModalV4({ trigger, onTicketCreated, initialTipo = 'sinistro' }: NovoTicketModalV4Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'tipo' | 'veiculo' | 'segurado' | 'dados'>('tipo')
  const [vinculoTipo, setVinculoTipo] = useState<'veiculo' | 'segurado'>('veiculo')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedSegurado, setSelectedSegurado] = useState<Segurado | null>(null)
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null | undefined>(undefined)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([])
  const [seguradoResults, setSeguradoResults] = useState<Segurado[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isCreatingNewSegurado, setIsCreatingNewSegurado] = useState(false)
  const [newSegurado, setNewSegurado] = useState({ nome: '', cpf: '' })
  
  // Form state
  const [tipoTicket, setTipoTicket] = useState<'sinistro' | 'assistencia'>(initialTipo)
  const [tipoSinistro, setTipoSinistro] = useState('')
  const [tipoAssistencia, setTipoAssistencia] = useState('')
  const [dataEvento, setDataEvento] = useState<any>(today(getLocalTimeZone()))
  const [valorEstimado, setValorEstimado] = useState('')
  const [gravidade, setGravidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const { toast } = useToast()
  const { activeEmpresa } = useUserProfile()

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast({
        title: "Digite pelo menos 2 caracteres",
        description: vinculoTipo === 'veiculo' 
          ? "Digite placa, chassi ou nome do proprietário"
          : "Digite nome, CPF ou cargo do segurado",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      if (vinculoTipo === 'veiculo') {
        const results = await VehiclesService.searchVehicles(searchQuery, activeEmpresa || undefined)
        setVehicleResults(results)
        
        if (results.length === 0) {
          toast({
            title: "Nenhum veículo encontrado",
            description: "Tente buscar por placa, chassi ou proprietário",
            variant: "destructive"
          })
        }
      } else {
        const results = await SeguradosService.searchSegurados(searchQuery, activeEmpresa || undefined)
        setSeguradoResults(results)
        
        if (results.length === 0) {
          toast({
            title: "Nenhum segurado encontrado",
            description: "Tente buscar por nome, CPF ou cargo",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar:', error)
      toast({
        title: "Erro ao buscar",
        description: "Não foi possível realizar a busca",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleVehicleSelect = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setLoadingPolicy(true)
    
    try {
      const policy = await VehiclesService.getPolicyByVehicleId(vehicle.id)
      setRelatedPolicy(policy)
    } catch (error) {
      console.error('Erro ao buscar apólice:', error)
      setRelatedPolicy(null)
    } finally {
      setLoadingPolicy(false)
    }
    
    setStep('dados')
  }

  const handleSeguradoSelect = (segurado: Segurado) => {
    setSelectedSegurado(segurado)
    setStep('dados')
  }

  const handleCreateNewSegurado = async () => {
    if (!newSegurado.nome.trim() || !newSegurado.cpf.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e CPF do segurado",
        variant: "destructive"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert({
          nome: newSegurado.nome.trim(),
          cpf: newSegurado.cpf.trim(),
          empresa_id: activeEmpresa,
          status: 'ativo'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Segurado criado com sucesso!",
        description: "O segurado foi cadastrado e selecionado",
      })

      setSelectedSegurado(data)
      setIsCreatingNewSegurado(false)
      setNewSegurado({ nome: '', cpf: '' })
      setStep('dados')
    } catch (error) {
      console.error('Erro ao criar segurado:', error)
      toast({
        title: "Erro ao criar segurado",
        description: "Não foi possível criar o segurado. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async () => {
    const currentSubtipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia
    if (!currentSubtipo || !dataEvento || !activeEmpresa) return
    if (!selectedVehicle && !selectedSegurado) return

    try {
      setSubmitting(true)

      // Preparar dados do ticket
      const ticketData = {
        tipo: tipoTicket, // 'sinistro' ou 'assistencia'
        subtipo: currentSubtipo, // tipo específico (colisao, guincho, etc)
        vehicle_id: selectedVehicle.id,
        apolice_id: relatedPolicy?.id,
        data_evento: dataEvento.toString(),
        valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        localizacao: undefined, // Pode ser adicionado se necessário
        empresa_id: activeEmpresa,
        status: 'aberto',
        origem: 'portal',
        payload: {
          descricao,
          gravidade: tipoTicket === 'sinistro' ? gravidade : undefined,
        }
      }

      console.log('📝 Criando ticket com dados:', ticketData)

      // Usar o hook de tickets ao invés do ClaimsService
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Ticket criado:', data)

      toast({
        title: "Ticket criado com sucesso!",
        description: "O ticket foi registrado e está em análise.",
      })

      handleClose()
      onTicketCreated?.()

    } catch (error) {
      console.error('Erro ao criar ticket:', error)
      toast({
        title: "Erro ao criar ticket",
        description: "Não foi possível criar o ticket. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = () => {
    const currentSubtipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia
    return (selectedVehicle || selectedSegurado) && currentSubtipo && dataEvento
  }

  const handleClose = () => {
    setStep('tipo')
    setVinculoTipo('veiculo')
    setSearchQuery('')
    setVehicleResults([])
    setSeguradoResults([])
    setHasSearched(false)
    setSelectedVehicle(null)
    setSelectedSegurado(null)
    setRelatedPolicy(undefined)
    setTipoTicket(initialTipo)
    setTipoSinistro('')
    setTipoAssistencia('')
    setDataEvento(today(getLocalTimeZone()))
    setValorEstimado('')
    setGravidade('')
    setDescricao('')
    setSubmitting(false)
    setIsCreatingNewSegurado(false)
    setNewSegurado({ nome: '', cpf: '' })
  }

  const modalContent = (
    <div className="space-y-6">
      {step === 'tipo' && (
        <div className="space-y-4">
          <div>
            <Label className="text-base">Tipo de Vínculo *</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Escolha se deseja vincular o sinistro a um veículo ou a um segurado da empresa
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setVinculoTipo('veiculo')
                setStep('veiculo')
              }}
              className={cn(
                "p-6 border-2 rounded-lg transition-all hover:border-primary hover:bg-accent",
                "flex flex-col items-center gap-3 text-center"
              )}
            >
              <Car className="h-12 w-12 text-primary" />
              <div>
                <div className="font-medium text-lg">Veículo</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Vincular a um veículo da frota
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setVinculoTipo('segurado')
                setStep('segurado')
              }}
              className={cn(
                "p-6 border-2 rounded-lg transition-all hover:border-primary hover:bg-accent",
                "flex flex-col items-center gap-3 text-center"
              )}
            >
              <CheckCircle className="h-12 w-12 text-primary" />
              <div>
                <div className="font-medium text-lg">Segurado</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Vincular a um segurado/colaborador
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 'segurado' && (
        <div className="space-y-4">
          {!isCreatingNewSegurado ? (
            <>
              <div>
                <Label>Buscar Segurado *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Digite nome, CPF ou cargo do segurado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || searchQuery.length < 2}
                    className="min-w-[100px]"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Digite pelo menos 2 caracteres e clique em "Buscar"
                </p>
              </div>

              {hasSearched && seguradoResults.length > 0 && (
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <h3 className="font-medium mb-3">Resultados da Busca ({seguradoResults.length})</h3>
                  <div className="space-y-2">
                    {seguradoResults.map((segurado) => (
                      <button
                        key={segurado.id}
                        onClick={() => handleSeguradoSelect(segurado)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-lg">{segurado.nome}</div>
                          {segurado.status && (
                            <Badge variant="default" className="text-xs">
                              {segurado.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <div>CPF: {segurado.cpf}</div>
                          {segurado.cargo && (
                            <div>Cargo: {segurado.cargo}</div>
                          )}
                          {segurado.email && (
                            <div>Email: {segurado.email}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasSearched && seguradoResults.length === 0 && !isSearching && (
                <div className="space-y-4">
                  <div className="text-center py-8 border rounded-lg bg-muted/30">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <div className="text-lg font-medium mb-2">Nenhum segurado encontrado</div>
                    <div className="text-sm text-muted-foreground mb-4">Tente buscar por nome, CPF ou cargo</div>
                    <Button
                      onClick={() => setIsCreatingNewSegurado(true)}
                      variant="default"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Novo Segurado
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-start">
                <Button variant="ghost" onClick={() => setStep('tipo')}>
                  Voltar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Criar Novo Segurado</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreatingNewSegurado(false)
                    setNewSegurado({ nome: '', cpf: '' })
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={newSegurado.nome}
                  onChange={(e) => setNewSegurado({ ...newSegurado, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={newSegurado.cpf}
                  onChange={(e) => setNewSegurado({ ...newSegurado, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateNewSegurado}
                  className="flex-1"
                  disabled={!newSegurado.nome.trim() || !newSegurado.cpf.trim()}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar e Selecionar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'veiculo' && (
        <div className="space-y-4">
          <div>
            <Label>Buscar Veículo *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Digite placa, chassi, marca/modelo ou proprietário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || searchQuery.length < 2}
                className="min-w-[100px]"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Digite pelo menos 2 caracteres e clique em "Buscar"
            </p>
          </div>

          {hasSearched && vehicleResults.length > 0 && (
            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <h3 className="font-medium mb-3">Resultados da Busca ({vehicleResults.length})</h3>
              <div className="space-y-2">
                {vehicleResults.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-lg">{vehicle.placa}</div>
                      {vehicle.status_seguro && (
                        <Badge variant={vehicle.status_seguro === 'ativa' ? 'default' : 'secondary'} className="text-xs">
                          {vehicle.status_seguro}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <div>{vehicle.marca} {vehicle.modelo} {vehicle.ano_modelo && `(${vehicle.ano_modelo})`}</div>
                      {vehicle.proprietario_nome && (
                        <div>Proprietário: {vehicle.proprietario_nome}</div>
                      )}
                      {vehicle.chassi && (
                        <div className="text-xs">Chassi: {vehicle.chassi.slice(-8)}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSearched && vehicleResults.length === 0 && !isSearching && (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <div className="text-lg font-medium mb-2">Nenhum veículo encontrado</div>
              <div className="text-sm text-muted-foreground">Tente buscar por placa, chassi ou proprietário</div>
            </div>
          )}
          
          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => setStep('tipo')}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {step === 'dados' && (selectedVehicle || selectedSegurado) && (
        <div className="space-y-6">
          {/* Veículo ou Segurado selecionado */}
          {selectedVehicle && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Veículo Selecionado</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('veiculo')
                    setSelectedVehicle(null)
                  }}
                  className="text-primary"
                >
                  Alterar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Placa:</span>
                  <span className="ml-2 font-medium">{selectedVehicle.placa}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Marca/Modelo:</span>
                  <span className="ml-2 font-medium">{selectedVehicle.marca} {selectedVehicle.modelo}</span>
                </div>
                {selectedVehicle.ano_modelo && (
                  <div>
                    <span className="text-muted-foreground">Ano:</span>
                    <span className="ml-2 font-medium">{selectedVehicle.ano_modelo}</span>
                  </div>
                )}
                {selectedVehicle.combustivel && (
                  <div>
                    <span className="text-muted-foreground">Combustível:</span>
                    <span className="ml-2 font-medium">{selectedVehicle.combustivel}</span>
                  </div>
                )}
                {selectedVehicle.chassi && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Chassi:</span>
                    <span className="ml-2 font-medium font-mono text-xs">{selectedVehicle.chassi}</span>
                  </div>
                )}
                {selectedVehicle.proprietario_nome && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Proprietário:</span>
                    <span className="ml-2 font-medium">{selectedVehicle.proprietario_nome}</span>
                  </div>
                )}
                {selectedVehicle.status_seguro && (
                  <div>
                    <span className="text-muted-foreground">Status Seguro:</span>
                    <Badge variant={selectedVehicle.status_seguro === 'ativa' ? 'default' : 'secondary'} className="ml-2">
                      {selectedVehicle.status_seguro}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedSegurado && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Segurado Selecionado</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('segurado')
                    setSelectedSegurado(null)
                  }}
                  className="text-primary"
                >
                  Alterar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="ml-2 font-medium">{selectedSegurado.nome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="ml-2 font-medium">{selectedSegurado.cpf}</span>
                </div>
                {selectedSegurado.cargo && (
                  <div>
                    <span className="text-muted-foreground">Cargo:</span>
                    <span className="ml-2 font-medium">{selectedSegurado.cargo}</span>
                  </div>
                )}
                {selectedSegurado.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{selectedSegurado.email}</span>
                  </div>
                )}
                {selectedSegurado.telefone && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="ml-2 font-medium">{selectedSegurado.telefone}</span>
                  </div>
                )}
                {selectedSegurado.status && (
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default" className="ml-2">
                      {selectedSegurado.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Apólice relacionada - apenas para veículos */}
          {selectedVehicle && (
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
          )}

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
                {tipoTicket === 'sinistro' ? (
                  <ComboboxRCorp
                    label="Tipo do Sinistro *"
                    placeholder="Digite para buscar..."
                    items={TIPOS_SINISTRO}
                    selectedKey={tipoSinistro || null}
                    onSelectionChange={(key) => setTipoSinistro(key as string || '')}
                    isRequired
                    allowsCustomValue={false}
                  />
                ) : (
                  <ComboboxRCorp
                    label="Tipo de Assistência *"
                    placeholder="Digite para buscar..."
                    items={TIPOS_ASSISTENCIA}
                    selectedKey={tipoAssistencia || null}
                    onSelectionChange={(key) => setTipoAssistencia(key as string || '')}
                    isRequired
                    allowsCustomValue={false}
                  />
                )}
              </div>

              <div>
                <DatePickerRCorp
                  label="Data do Evento *"
                  value={dataEvento}
                  onChange={(date) => setDataEvento(date || today(getLocalTimeZone()))}
                  maxValue={today(getLocalTimeZone())}
                  isRequired
                  description="Selecione a data em que o evento ocorreu"
                />
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
                  <ComboboxRCorp
                    label="Gravidade"
                    placeholder="Digite para buscar..."
                    items={NIVEIS_GRAVIDADE}
                    selectedKey={gravidade || null}
                    onSelectionChange={(key) => setGravidade(key as string || '')}
                    allowsCustomValue={false}
                  />
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
        </div>
      )}
    </div>
  )

  const modalFooter = step === 'dados' ? (
    <div className="flex items-center justify-between">
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
  ) : undefined

  return (
    <DialogRCorp
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          handleClose()
        }
      }}
      trigger={trigger}
      title={
        <div className="flex items-center gap-2">
          {tipoTicket === 'sinistro' ? (
            <Car className="h-5 w-5 text-red-600" />
          ) : (
            <Wrench className="h-5 w-5 text-blue-600" />
          )}
          Novo Ticket - {tipoTicket === 'sinistro' ? 'Sinistro' : 'Assistência'}
        </div>
      }
      size="lg"
      footer={modalFooter}
      className="max-w-5xl"
    >
      {modalContent}
    </DialogRCorp>
  )
}