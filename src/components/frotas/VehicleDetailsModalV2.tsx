import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogRCorp } from '@/components/ui-v2/dialog-rcorp'
import { formatCurrency } from '@/utils/currencyFormatter'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FrotaVeiculo } from '@/hooks/useFrotasData'
import { 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  MapPin,
  CreditCard,
  Receipt
} from 'lucide-react'

interface VehicleDetailsModalV2Props {
  veiculo: FrotaVeiculo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VehicleDetailsModalV2({ veiculo, open, onOpenChange }: VehicleDetailsModalV2Props) {
  if (!veiculo) return null

  // Helper functions para badges e formatação
  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Não informado</Badge>
    
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800">Segurado</Badge>
      case 'sem_seguro':
      case 'nao_segurado':
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800">Sem Seguro</Badge>
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800">Em Cotação</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return <Badge variant="outline">Não informado</Badge>
    
    const colors = {
      carro: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
      moto: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
      outros: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
    }

    const labels = {
      carro: 'Carro',
      moto: 'Moto',
      caminhao: 'Caminhão',
      outros: 'Outros',
    }

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria.charAt(0).toUpperCase() + categoria.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const formatCurrencyValue = (value: number | null | undefined) => {
    if (!value) return '-'
    return formatCurrency(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (!value) return '-'
    return `${value.toLocaleString('pt-BR')}%`
  }

  const modalContent = (
    <div className="space-y-6">
      {/* Header com badges e placa */}
      <div className="flex flex-wrap items-center gap-3">
        {getCategoriaBadge(veiculo.categoria)}
        {getStatusBadge(veiculo.status_seguro)}
        <div className="font-mono text-lg font-bold bg-muted px-3 py-1 rounded">
          {veiculo.placa}
        </div>
        {veiculo.uf_emplacamento && (
          <Badge variant="outline">{veiculo.uf_emplacamento}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Veículo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Car className="h-5 w-5" />
              Informações do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Marca:</span>
              <p className="font-medium">{veiculo.marca || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Modelo:</span>
              <p className="font-medium">{veiculo.modelo || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
              <div className="mt-1">{getCategoriaBadge(veiculo.categoria)}</div>
            </div>
            {veiculo.renavam && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">RENAVAM:</span>
                <p className="font-mono font-medium">{veiculo.renavam}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proprietário */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <User className="h-5 w-5" />
              Proprietário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Nome:</span>
              <p className="font-medium">{veiculo.proprietario_nome || '-'}</p>
            </div>
            {veiculo.proprietario_tipo && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                <Badge variant="outline" className="ml-2">
                  {veiculo.proprietario_tipo === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </Badge>
              </div>
            )}
            {veiculo.proprietario_doc && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Documento:</span>
                <p className="font-mono font-medium">{veiculo.proprietario_doc}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emplacamento e Licenciamento */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <MapPin className="h-5 w-5" />
              Emplacamento e Licenciamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">UF de Emplacamento:</span>
              <p className="font-medium">{veiculo.uf_emplacamento || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Vencimento do Licenciamento:</span>
              <p className="font-medium">{formatDate(veiculo.data_venc_emplacamento)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Valores Financeiros */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <DollarSign className="h-5 w-5" />
              Valores Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Preço FIPE:</span>
              <p className="font-medium text-green-600 dark:text-green-400">{formatCurrencyValue(veiculo.preco_fipe)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Valor NF:</span>
              <p className="font-medium">{formatCurrencyValue(veiculo.preco_nf)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">% Tabela FIPE:</span>
              <p className="font-medium">{formatPercentage(veiculo.percentual_tabela)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modalidade de Compra */}
      {(veiculo.modalidade_compra || veiculo.consorcio_grupo || veiculo.consorcio_cota) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <CreditCard className="h-5 w-5" />
              Modalidade de Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {veiculo.modalidade_compra && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Modalidade:</span>
                  <Badge className="ml-2" variant="outline">
                    {veiculo.modalidade_compra === 'financiado' ? 'Financiado' :
                     veiculo.modalidade_compra === 'avista' ? 'À Vista' :
                     veiculo.modalidade_compra === 'consorcio' ? 'Consórcio' : veiculo.modalidade_compra}
                  </Badge>
                </div>
              )}
              
              {veiculo.modalidade_compra === 'consorcio' && (
                <>
                  {veiculo.consorcio_grupo && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Grupo do Consórcio:</span>
                      <p className="font-medium">{veiculo.consorcio_grupo}</p>
                    </div>
                  )}
                  {veiculo.consorcio_cota && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Cota:</span>
                      <p className="font-medium">{veiculo.consorcio_cota}</p>
                    </div>
                  )}
                  {veiculo.consorcio_taxa_adm && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Taxa Administrativa:</span>
                      <p className="font-medium">{formatPercentage(veiculo.consorcio_taxa_adm)}</p>
                    </div>
                  )}
                  {veiculo.data_venc_ultima_parcela && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Vencimento Última Parcela:</span>
                      <p className="font-medium">{formatDate(veiculo.data_venc_ultima_parcela)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {veiculo.observacoes && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{veiculo.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Informações do Sistema */}
      {(veiculo.created_at || veiculo.updated_at) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Calendar className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {veiculo.created_at && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Cadastrado em:</span>
                  <p className="font-medium">{formatDate(veiculo.created_at)}</p>
                </div>
              )}
              {veiculo.updated_at && veiculo.updated_at !== veiculo.created_at && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Última atualização:</span>
                  <p className="font-medium">{formatDate(veiculo.updated_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <DialogRCorp
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2 text-xl">
          <Car className="h-6 w-6 text-blue-600" />
          {veiculo.marca || 'Marca'} {veiculo.modelo || 'Modelo'}
          {veiculo.ano_modelo && (
            <span className="text-muted-foreground">({veiculo.ano_modelo})</span>
          )}
        </div>
      }
      size="lg"
      className="max-w-4xl"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {modalContent}
      </div>
    </DialogRCorp>
  )
}