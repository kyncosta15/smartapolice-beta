import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  MapPin,
  CreditCard,
  Receipt
} from 'lucide-react';

interface VehicleDetailsModalProps {
  veiculo: FrotaVeiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsModal({ veiculo, open, onOpenChange }: VehicleDetailsModalProps) {
  if (!veiculo) return null;

  // Helper functions para badges e formatação
  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Não informado</Badge>;
    
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Segurado</Badge>;
      case 'sem_seguro':
      case 'nao_segurado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Seguro</Badge>;
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Cotação</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return <Badge variant="outline">Não informado</Badge>;
    
    const colors = {
      carro: 'bg-blue-100 text-blue-800 border-blue-200',
      moto: 'bg-green-100 text-green-800 border-green-200',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200',
      outros: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      carro: 'Carro',
      moto: 'Moto',
      caminhao: 'Caminhão',
      outros: 'Outros',
    };

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria.charAt(0).toUpperCase() + categoria.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCurrencyValue = (value: number | null | undefined) => {
    if (!value) return '-';
    return formatCurrency(value);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (!value) return '-';
    return `${value.toLocaleString('pt-BR')}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Car className="h-6 w-6 text-blue-600" />
            {veiculo.marca || 'Marca'} {veiculo.modelo || 'Modelo'}
            {veiculo.ano_modelo && (
              <span className="text-muted-foreground">({veiculo.ano_modelo})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com badges e placa */}
          <div className="flex flex-wrap items-center gap-3">
            {getCategoriaBadge(veiculo.categoria)}
            {getStatusBadge(veiculo.status_seguro)}
            <div className="font-mono text-lg font-bold bg-gray-100 px-3 py-1 rounded">
              {veiculo.placa}
            </div>
            {veiculo.uf_emplacamento && (
              <Badge variant="outline">{veiculo.uf_emplacamento}</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Veículo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Valores Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Preço FIPE:</span>
                  <p className="font-medium text-green-600">{formatCurrencyValue(veiculo.preco_fipe)}</p>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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

          {/* Pagamentos */}
          {veiculo.pagamentos && veiculo.pagamentos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5" />
                  Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {veiculo.pagamentos.map((pagamento, index) => (
                    <div key={pagamento.id || index} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                          <p className="font-medium">{pagamento.tipo}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Valor:</span>
                          <p className="font-medium text-green-600">{formatCurrencyValue(pagamento.valor)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Vencimento:</span>
                          <p className="font-medium">{formatDate(pagamento.vencimento)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Status:</span>
                          <Badge variant={pagamento.status === 'pendente' ? 'destructive' : 'default'}>
                            {pagamento.status}
                          </Badge>
                        </div>
                        {pagamento.observacoes && (
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-muted-foreground">Observações:</span>
                            <p className="text-sm">{pagamento.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentos */}
          {veiculo.documentos && veiculo.documentos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {veiculo.documentos.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{doc.nome_arquivo || `Documento ${index + 1}`}</span>
                      <Badge variant="outline">{doc.tipo || 'Documento'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {veiculo.observacoes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
      </DialogContent>
    </Dialog>
  );
}

// Função de mapeamento N8N -> Schema do banco (exportada para uso em outros locais)
export function mapN8NToVeiculoDB(n8nData: any): Partial<FrotaVeiculo> {
  const categoria = (n8nData.familia ?? 'outros').toString().toLowerCase();

  // Heurística simples para marca
  const marca = (n8nData.marca ?? '').toString()
    .replace(/^m\.?benz$/i, 'MERCEDES BENZ')
    .trim();

  // Proprietário vem como string → guardar no nome e assumir 'pj' por padrão
  const proprietario_nome = n8nData.proprietario ?? null;
  const proprietario_tipo = proprietario_nome ? 'pj' : null;

  return {
    placa: n8nData.placa ?? null,
    renavam: n8nData.renavam ?? null,
    marca: marca || null,
    modelo: n8nData.modelo ?? null,
    ano_modelo: Number.isFinite(n8nData.ano) ? Number(n8nData.ano) : null,
    categoria,
    proprietario_nome,
    proprietario_tipo,
    // Campos sem origem no n8n ficam null
    uf_emplacamento: null,
    data_venc_emplacamento: null,
    status_seguro: 'sem_seguro',
    preco_fipe: null,
    preco_nf: null,
    percentual_tabela: null,
    modalidade_compra: null,
    consorcio_grupo: null,
    consorcio_cota: null,
    consorcio_taxa_adm: null,
    data_venc_ultima_parcela: null,
    observacoes: n8nData.origem_planilha ? `Importado do N8N - ${n8nData.origem_planilha}` : null,
  };
}