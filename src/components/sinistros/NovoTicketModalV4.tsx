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
import { CheckCircle, AlertTriangle, Car, Wrench, Search } from 'lucide-react'
import { today, getLocalTimeZone } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { Vehicle, Policy } from '@/types/claims'
import { VehiclesService } from '@/services/vehicles'
import { ClaimsService } from '@/services/claims'

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
  const [step, setStep] = useState<'veiculo' | 'dados'>('veiculo')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [relatedPolicy, setRelatedPolicy] = useState<Policy | null | undefined>(undefined)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
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
        description: "Digite placa, chassi ou nome do proprietário",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      const results = await VehiclesService.searchVehicles(searchQuery, activeEmpresa || undefined)
      setVehicleResults(results)
      
      if (results.length === 0) {
        toast({
          title: "Nenhum veículo encontrado",
          description: "Tente buscar por placa, chassi ou proprietário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
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

  const handleSubmit = async () => {
    const currentTipo = tipoTicket === 'sinistro' ? tipoSinistro : tipoAssistencia
    if (!selectedVehicle || !currentTipo || !dataEvento || !activeEmpresa) return

    try {
      setSubmitting(true)

      const claimData = {
        veiculo_id: selectedVehicle.id,
        apolice_id: relatedPolicy?.id,
        tipo: currentTipo,
        data_evento: dataEvento.toString(),
        valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        gravidade: tipoTicket === 'sinistro' ? gravidade : undefined,
        descricao,
        is_assistencia: tipoTicket === 'assistencia',
        tipo_assistencia: tipoTicket === 'assistencia' ? tipoAssistencia : undefined,
        empresa_id: activeEmpresa
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
    setVehicleResults([])
    setHasSearched(false)
    setSelectedVehicle(null)
    setRelatedPolicy(undefined)
    setTipoTicket(initialTipo)
    setTipoSinistro('')
    setTipoAssistencia('')
    setDataEvento(today(getLocalTimeZone()))
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
                    <div className="font-medium">{vehicle.placa}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.marca} {vehicle.modelo}
                      {vehicle.proprietario_nome && ` • ${vehicle.proprietario_nome}`}
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