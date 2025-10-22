import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Car } from 'lucide-react'
import { FrotaVeiculo } from '@/hooks/useFrotasData'
import { useIsMobile } from '@/hooks/use-mobile'
import { VehicleActionsV2 } from './VehicleActionsV2'
import { VehicleDetailsModalV2 } from './VehicleDetailsModalV2'
import { VehicleListMobile } from './VehicleListMobile'
import { FrotasBulkActions } from './FrotasBulkActions'
import { VehicleStatusBadge } from './VehicleStatusBadge'

interface FrotasTableV2Props {
  veiculos: FrotaVeiculo[]
  loading: boolean
  onRefetch: () => void
  maxHeight?: string
  hideHeader?: boolean
}

export function FrotasTableV2({ 
  veiculos, 
  loading, 
  onRefetch, 
  maxHeight = '60vh', 
  hideHeader = false 
}: FrotasTableV2Props) {
  const [selectedVeiculo, setSelectedVeiculo] = useState<FrotaVeiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVehicles, setSelectedVehicles] = useState<FrotaVeiculo[]>([])
  
  const isMobile = useIsMobile()

  const handleView = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id)
    if (veiculo) {
      setSelectedVeiculo(veiculo)
      setModalOpen(true)
    }
  }

  const handleEdit = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id)
    if (veiculo) {
      // TODO: Implementar edição
      console.log('Editar veículo:', veiculo)
    }
  }

  const handleDocs = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id)
    if (veiculo) {
      // TODO: Implementar documentos
      console.log('Ver documentos:', veiculo)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles([...veiculos])
    } else {
      setSelectedVehicles([])
    }
  }

  const handleSelectVehicle = (veiculo: FrotaVeiculo, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, veiculo])
    } else {
      setSelectedVehicles(prev => prev.filter(v => v.id !== veiculo.id))
    }
  }

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(v => v.id === vehicleId)
  }

  const isAllSelected = selectedVehicles.length === veiculos.length && veiculos.length > 0
  const isPartialSelected = selectedVehicles.length > 0 && selectedVehicles.length < veiculos.length

  // Removido - agora usando VehicleStatusBadge component

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return null
    
    const colors = {
      passeio: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
      utilitario: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
      moto: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
      outros: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
    }

    const labels = {
      passeio: 'Passeio',
      utilitario: 'Utilitário',
      caminhao: 'Caminhão',
      moto: 'Moto',
      outros: 'Outros',
    }

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria}
      </Badge>
    )
  }

  if (loading) {
    const loadingContent = (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-3 p-3 border border-border rounded-lg bg-card">
            <div className="rounded-full bg-muted h-10 w-10 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )

    if (hideHeader) return loadingContent
    
    return (
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          {loadingContent}
        </CardContent>
      </Card>
    )
  }

  if (veiculos.length === 0) {
    const emptyContent = (
      <div className="text-center py-8 sm:py-12">
        <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum veículo encontrado
        </h3>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          Não há veículos cadastrados ou que correspondam aos filtros aplicados.
        </p>
        <Button onClick={onRefetch} variant="outline" size="sm">
          Recarregar dados
        </Button>
      </div>
    )

    if (hideHeader) return emptyContent
    
    return (
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          {emptyContent}
        </CardContent>
      </Card>
    )
  }

  const tableContent = (
    <div className="space-y-3 md:space-y-4">
      <FrotasBulkActions
        selectedVehicles={selectedVehicles}
        onClearSelection={() => setSelectedVehicles([])}
        onUpdateComplete={onRefetch}
        allVehicles={veiculos}
        onSelectVehicles={setSelectedVehicles}
      />
      
      <div className="w-full overflow-x-auto max-h-[50vh] md:max-h-[60vh] overflow-y-auto">
        <div className="p-2 md:p-4">
          {isMobile ? (
            <VehicleListMobile
              veiculos={veiculos}
              onView={handleView}
              onEdit={handleEdit}
              onDocs={handleDocs}
              selectedVehicles={selectedVehicles}
              onSelectVehicle={handleSelectVehicle}
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12 bg-background">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        {...(isPartialSelected && { 'data-state': 'indeterminate' })}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px] bg-background">Veículo</TableHead>
                    <TableHead className="min-w-[120px] bg-background">Placa</TableHead>
                    <TableHead className="min-w-[150px] bg-background">Proprietário</TableHead>
                    <TableHead className="min-w-[120px] bg-background">Status Seguro</TableHead>
                    <TableHead className="w-[120px] text-right bg-background">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos.map((veiculo) => {
                    const isSelected = isVehicleSelected(veiculo.id)

                    return (
                      <TableRow key={veiculo.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                        <TableCell className="bg-inherit">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectVehicle(veiculo, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="bg-inherit">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">
                              {veiculo.marca} {veiculo.modelo}
                            </div>
                            {veiculo.ano_modelo && (
                              <div className="text-sm text-muted-foreground">
                                {veiculo.ano_modelo}
                              </div>
                            )}
                            {getCategoriaBadge(veiculo.categoria)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="bg-inherit">
                          <div className="font-mono font-medium">
                            {veiculo.placa}
                          </div>
                          {veiculo.uf_emplacamento && (
                            <div className="text-sm text-muted-foreground">
                              {veiculo.uf_emplacamento}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="bg-inherit">
                          <div className="space-y-1">
                            {veiculo.proprietario_nome && (
                              <div className="font-medium text-foreground">
                                {veiculo.proprietario_nome}
                              </div>
                            )}
                            {veiculo.proprietario_doc && (
                              <div className="text-sm text-muted-foreground font-mono">
                                {veiculo.proprietario_doc}
                              </div>
                            )}
                            {veiculo.proprietario_tipo && (
                              <Badge variant="outline" className="text-xs">
                                {veiculo.proprietario_tipo === 'pj' ? 'PJ' : 'PF'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="bg-inherit">
                          <VehicleStatusBadge 
                            status={veiculo.status_seguro} 
                            vehicleId={veiculo.id}
                          />
                        </TableCell>

                        <TableCell className="text-right bg-inherit">
                          <VehicleActionsV2
                            veiculo={veiculo}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDocs={handleDocs}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const content = (
    <>
      {tableContent}
      <VehicleDetailsModalV2 
        veiculo={selectedVeiculo}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )

  if (hideHeader) return content

  return (
    <>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4 border-b">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-4 w-4 md:h-5 md:w-5" />
            Lista de Veículos V2 ({veiculos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tableContent}
        </CardContent>
      </Card>

      <VehicleDetailsModalV2 
        veiculo={selectedVeiculo}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}