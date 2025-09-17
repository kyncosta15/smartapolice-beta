import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Phone, 
  MapPin,
  CreditCard,
  Shield
} from 'lucide-react';

interface VehicleDetailsModalProps {
  veiculo: FrotaVeiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsModal({ veiculo, open, onOpenChange }: VehicleDetailsModalProps) {
  if (!veiculo) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Segurado</Badge>;
      case 'sem_seguro':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Seguro</Badge>;
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Cotação</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return null;
    
    const colors = {
      passeio: 'bg-blue-100 text-blue-800 border-blue-200',
      utilitario: 'bg-purple-100 text-purple-800 border-purple-200',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200',
      moto: 'bg-green-100 text-green-800 border-green-200',
      outros: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      passeio: 'Passeio',
      utilitario: 'Utilitário',
      caminhao: 'Caminhão',
      moto: 'Moto',
      outros: 'Outros',
    };

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria}
      </Badge>
    );
  };

  const getModalidadeBadge = (modalidade?: string) => {
    if (!modalidade) return null;
    
    const colors = {
      financiado: 'bg-blue-100 text-blue-800 border-blue-200',
      avista: 'bg-green-100 text-green-800 border-green-200',
      consorcio: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const labels = {
      financiado: 'Financiado',
      avista: 'À Vista',
      consorcio: 'Consórcio',
    };

    return (
      <Badge className={colors[modalidade as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labels[modalidade as keyof typeof labels] || modalidade}
      </Badge>
    );
  };

  const getEmplacamentoStatus = (dataVencimento?: string) => {
    if (!dataVencimento) return { text: 'Não definido', color: 'text-gray-500' };
    
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return { text: 'Vencido', color: 'text-red-600' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} dias`, color: 'text-yellow-600' };
    } else {
      return { text: format(vencimento, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-green-600' };
    }
  };

  const emplacamentoStatus = getEmplacamentoStatus(veiculo.data_venc_emplacamento);
  const responsavel = veiculo.responsaveis?.[0];
  const documento = veiculo.documentos?.[0];
  const pagamento = veiculo.pagamentos?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Car className="h-6 w-6 text-blue-600" />
            {veiculo.marca} {veiculo.modelo}
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

          <Separator />

          {/* Informações do Veículo */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Informações do Veículo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {veiculo.renavam && (
                <div>
                  <span className="text-sm text-muted-foreground">Renavam:</span>
                  <p className="font-medium">{veiculo.renavam}</p>
                </div>
              )}
              {veiculo.categoria && (
                <div>
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <div className="mt-1">
                    {getCategoriaBadge(veiculo.categoria)}
                  </div>
                </div>
              )}
              {veiculo.percentual_tabela && (
                <div>
                  <span className="text-sm text-muted-foreground">% Tabela FIPE:</span>
                  <p className="font-medium">{veiculo.percentual_tabela}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Proprietário */}
          {veiculo.proprietario_nome && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Proprietário
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{veiculo.proprietario_nome}</p>
                  </div>
                  {veiculo.proprietario_doc && (
                    <div>
                      <span className="text-sm text-muted-foreground">Documento:</span>
                      <p className="font-mono font-medium">{veiculo.proprietario_doc}</p>
                    </div>
                  )}
                  {veiculo.proprietario_tipo && (
                    <div>
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="ml-2">
                        {veiculo.proprietario_tipo === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Emplacamento */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Emplacamento e Licenciamento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <p className={`font-medium ${emplacamentoStatus.color}`}>
                  {emplacamentoStatus.text}
                </p>
              </div>
              {veiculo.data_venc_emplacamento && (
                <div>
                  <span className="text-sm text-muted-foreground">Vencimento:</span>
                  <p className="font-medium">
                    {format(new Date(veiculo.data_venc_emplacamento), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informações Financeiras */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {veiculo.preco_fipe && (
                <div>
                  <span className="text-sm text-muted-foreground">Valor FIPE:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(veiculo.preco_fipe)}
                  </p>
                </div>
              )}
              {veiculo.preco_nf && (
                <div>
                  <span className="text-sm text-muted-foreground">Valor NF:</span>
                  <p className="font-medium">
                    {formatCurrency(veiculo.preco_nf)}
                  </p>
                </div>
              )}
              {veiculo.modalidade_compra && (
                <div>
                  <span className="text-sm text-muted-foreground">Modalidade:</span>
                  <div className="mt-1">
                    {getModalidadeBadge(veiculo.modalidade_compra)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Detalhes do consórcio */}
            {veiculo.modalidade_compra === 'consorcio' && (veiculo.consorcio_grupo || veiculo.consorcio_cota) && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">Detalhes do Consórcio</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {veiculo.consorcio_grupo && (
                    <div>
                      <span className="text-orange-600">Grupo:</span>
                      <span className="ml-2 font-medium">{veiculo.consorcio_grupo}</span>
                    </div>
                  )}
                  {veiculo.consorcio_cota && (
                    <div>
                      <span className="text-orange-600">Cota:</span>
                      <span className="ml-2 font-medium">{veiculo.consorcio_cota}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Responsável */}
          {responsavel && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsável
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-medium">{responsavel.nome}</p>
                  </div>
                  {responsavel.telefone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {responsavel.telefone}
                      </p>
                    </div>
                  )}
                  {responsavel.cnh_numero && (
                    <div>
                      <span className="text-sm text-muted-foreground">CNH:</span>
                      <p className="font-mono font-medium">{responsavel.cnh_numero}</p>
                    </div>
                  )}
                  {responsavel.cnh_validade && (
                    <div>
                      <span className="text-sm text-muted-foreground">Validade CNH:</span>
                      <p className="font-medium">
                        {format(new Date(responsavel.cnh_validade), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Dados adicionais */}
          {veiculo.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{veiculo.observacoes}</p>
                </div>
              </div>
            </>
          )}

          {(veiculo.created_at || veiculo.updated_at) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Sistema
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {veiculo.created_at && (
                    <div>
                      <span className="text-muted-foreground">Cadastrado em:</span>
                      <p className="font-medium">
                        {format(new Date(veiculo.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {veiculo.updated_at && veiculo.updated_at !== veiculo.created_at && (
                    <div>
                      <span className="text-muted-foreground">Última atualização:</span>
                      <p className="font-medium">
                        {format(new Date(veiculo.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}