import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { DialogRCorp } from '@/components/ui-v2/dialog-rcorp'
// Temporarily using basic combobox with shadcn components for Phase 1
// Will be replaced with React Aria ComboboxRCorp in Phase 2
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { CalendarIcon, CheckCircle, AlertTriangle, Car, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Vehicle, Policy } from '@/types/claims'
import { VehiclesService } from '@/services/vehicles'
import { ClaimsService } from '@/services/claims'

type NovoTicketModalV2Props = {
  trigger: React.ReactNode
  onTicketCreated?: () => void
  initialTipo?: 'sinistro' | 'assistencia'
}

export function NovoTicketModalV2({ trigger, onTicketCreated, initialTipo = 'sinistro' }: NovoTicketModalV2Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'veiculo' | 'dados'>('veiculo')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null>(undefined)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  
  // Form state
  const [tipoTicket, setTipoTicket] = useState<'sinistro' | 'assistencia'>(initialTipo)
  const [tipoSinistro, setTipoSinistro] = useState('')
  const [tipoAssistencia, setTipoAssistencia] = useState('')
  const [dataEvento, setDataEvento] = useState<Date | undefined>()
  const [valorEstimado, setValorEstimado] = useState('')
  const [gravidade, setGravidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const { toast } = useToast()

  // Simple vehicle search items (Phase 1)
  const vehicleSearchItems = searchResults.map(vehicle => ({
    id: vehicle.id,
    label: vehicle.placa,
    description: `${vehicle.marca} ${vehicle.modelo} • ${vehicle.proprietario_nome || 'N/A'}`,
  }))

  // Search vehicles with debounce
  useEffect(() => {
    if (open && searchQuery && searchQuery.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchVehicles()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, open])

  const searchVehicles = async () => {
    try {
      setLoadingSearch(true)
      const results = await VehiclesService.searchVehicles(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
      toast({
        title: "Erro ao buscar veículos",
        description: "Tente novamente com outros termos.",
        variant: "destructive"
      })
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleVehicleSelect = async (vehicleId: string | null) => {
    if (!vehicleId) {
      setSelectedVehicle(null)
      setRelatedPolicy(undefined)
      return
    }

    const vehicle = searchResults.find(v => v.id === vehicleId)
    if (!vehicle) return

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

  const handleSubmit = async () => {
    const currentTipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia
    if (!selectedVehicle || !currentTipo || !dataEvento) return

    try {
      setSubmitting(true)

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
      }

      await ClaimsService.createClaim(claimData)

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
    const currentTipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia
    return selectedVehicle && currentTipo && dataEvento
  }

  const handleClose = () => {
    setStep('veiculo')
    setSearchQuery('')
    setSearchResults([])
    setSelectedVehicle(null)
    setRelatedPolicy(undefined)
    setTipoTicket(initialTipo)
    setTipoSinistro('')
    setTipoAssistencia('')
    setDataEvento(undefined)
    setValorEstimado('')
    setGravidade('')
    setDescricao('')
    setSubmitting(false)
  }

  const modalContent = (
    <div className="space-y-6">
      {step === 'veiculo' && (
        <div className="space-y-4">
          <div>
            <Label>Selecionar Veículo *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedVehicle 
                    ? `${selectedVehicle.placa} - ${selectedVehicle.marca} ${selectedVehicle.modelo}`
                    : "Buscar veículo..."
                  }
                  <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Digite placa, chassi ou nome..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingSearch ? "Buscando..." : "Nenhum veículo encontrado."}
                    </CommandEmpty>
                    <CommandGroup>
                      {vehicleSearchItems.map((vehicle) => (
                        <CommandItem
                          key={vehicle.id}
                          value={vehicle.id}
                          onSelect={() => handleVehicleSelect(vehicle.id)}
                        >
                          <div>
                            <div className="font-medium">{vehicle.label}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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