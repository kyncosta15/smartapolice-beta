import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  FileText, 
  MoreVertical,
  Car
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleListMobileProps {
  veiculos: FrotaVeiculo[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDocs: (id: string) => void;
}

interface VehicleCardProps {
  veiculo: FrotaVeiculo;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDocs: (id: string) => void;
}

function VehicleCard({ veiculo, onView, onEdit, onDocs }: VehicleCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Segurado</Badge>;
      case 'sem_seguro':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Sem Seguro</Badge>;
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Em Cotação</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
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
      <Badge className={`${colors[categoria as keyof typeof colors] || colors.outros} text-xs`}>
        {labels[categoria as keyof typeof labels] || categoria}
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
      return { text: `${diffDays}d`, color: 'text-yellow-600' };
    } else {
      return { text: format(vencimento, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-green-600' };
    }
  };

  const emplacamentoStatus = getEmplacamentoStatus(veiculo.data_venc_emplacamento);
  const responsavel = veiculo.responsaveis?.[0];

  return (
    <Card className="p-3 border border-gray-200 rounded-lg">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
        {/* Conteúdo principal */}
        <div className="min-w-0 space-y-2">
          {/* Título e marca */}
          <div>
            <h3 className="font-medium text-foreground text-sm truncate">
              {veiculo.marca} {veiculo.modelo}
            </h3>
            {veiculo.ano_modelo && (
              <p className="text-xs text-muted-foreground">
                {veiculo.ano_modelo}
              </p>
            )}
          </div>

          {/* Badges e placa */}
          <div className="flex flex-wrap items-center gap-2">
            {getCategoriaBadge(veiculo.categoria)}
            {getStatusBadge(veiculo.status_seguro)}
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded tracking-wide">
              {veiculo.placa}
            </span>
          </div>

          {/* Informações do proprietário */}
          {veiculo.proprietario_nome && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Proprietário:</span> {veiculo.proprietario_nome}
              </p>
              {veiculo.proprietario_doc && (
                <p className="text-xs text-muted-foreground font-mono">
                  {veiculo.proprietario_doc}
                </p>
              )}
            </div>
          )}

          {/* Informações de emplacamento */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Emplacamento:</span>{' '}
              <span className={emplacamentoStatus.color}>{emplacamentoStatus.text}</span>
            </p>
            {veiculo.uf_emplacamento && (
              <p className="text-xs text-muted-foreground">
                UF: {veiculo.uf_emplacamento}
              </p>
            )}
          </div>

          {/* Valores financeiros */}
          <div className="flex flex-wrap gap-4 text-xs">
            {veiculo.preco_fipe && (
              <div>
                <span className="text-muted-foreground">FIPE:</span>{' '}
                <span className="font-medium text-green-600">
                  {formatCurrency(veiculo.preco_fipe)}
                </span>
              </div>
            )}
            {veiculo.preco_nf && (
              <div>
                <span className="text-muted-foreground">NF:</span>{' '}
                <span className="font-medium">
                  {formatCurrency(veiculo.preco_nf)}
                </span>
              </div>
            )}
          </div>

          {/* Responsável */}
          {responsavel && (
            <div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Responsável:</span> {responsavel.nome}
              </p>
              {responsavel.telefone && (
                <p className="text-xs text-muted-foreground">
                  {responsavel.telefone}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-start gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => onView(veiculo.id)}
            aria-label="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                aria-label="Mais ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => onView(veiculo.id)}>
                <Eye className="mr-2 h-4 w-4" /> Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(veiculo.id)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDocs(veiculo.id)}>
                <FileText className="mr-2 h-4 w-4" /> Documentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

export function VehicleListMobile({ veiculos, onView, onEdit, onDocs }: VehicleListMobileProps) {
  if (veiculos.length === 0) {
    return (
      <div className="text-center py-8">
        <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum veículo encontrado
        </h3>
        <p className="text-gray-500">
          Não há veículos cadastrados ou que correspondam aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {veiculos.map((veiculo) => (
        <VehicleCard
          key={veiculo.id}
          veiculo={veiculo}
          onView={onView}
          onEdit={onEdit}
          onDocs={onDocs}
        />
      ))}
    </div>
  );
}