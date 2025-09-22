import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Eye, 
  Edit, 
  AlertTriangle, 
  Wrench, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTicketsData } from '@/hooks/useTicketsData';
import { TicketStatus, Ticket } from '@/types/tickets';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TicketsList() {
  const { tickets, loading, updateTicketStatus } = useTicketsData();

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'aberto':
        return <Clock className="h-4 w-4" />;
      case 'em_analise':
        return <AlertTriangle className="h-4 w-4" />;
      case 'finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'aberto':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'em_analise':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'finalizado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'sinistro' ? 
      <AlertTriangle className="h-4 w-4 text-red-600" /> : 
      <Wrench className="h-4 w-4 text-blue-600" />;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await updateTicketStatus(ticketId, newStatus);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-6 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
            <AlertTriangle className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum ticket encontrado
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Não há tickets que correspondam aos filtros aplicados.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {getTipoIcon(ticket.tipo)}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {ticket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{ticket.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {ticket.subtipo?.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(ticket.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </div>
                </Badge>
              </div>
            </div>

            {/* Informações do Veículo */}
            {ticket.vehicle && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Car className="h-4 w-4" />
                <span>
                  {ticket.vehicle.placa} - {ticket.vehicle.marca} {ticket.vehicle.modelo}
                </span>
                {ticket.vehicle.status_seguro && (
                  <Badge variant="outline" className="text-xs">
                    {ticket.vehicle.status_seguro === 'segurado' ? 'Segurado' : 'Sem Seguro'}
                  </Badge>
                )}
              </div>
            )}

            {/* Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {ticket.data_evento && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(ticket.data_evento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {ticket.valor_estimado && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(ticket.valor_estimado)}</span>
                </div>
              )}

              {ticket.localizacao && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{ticket.localizacao}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Descrição */}
            {ticket.descricao && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {ticket.descricao}
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-3 w-3" />
                  Ver Detalhes
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
              </div>

              {/* Ações de Status */}
              {ticket.status === 'aberto' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange(ticket.id, 'em_analise')}
                  >
                    Analisar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusChange(ticket.id, 'finalizado')}
                  >
                    Finalizar
                  </Button>
                </div>
              )}

              {ticket.status === 'em_analise' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange(ticket.id, 'aberto')}
                  >
                    Reabrir
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusChange(ticket.id, 'finalizado')}
                  >
                    Finalizar
                  </Button>
                </div>
              )}

              {(ticket.status === 'finalizado' || ticket.status === 'cancelado') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange(ticket.id, 'aberto')}
                >
                  Reabrir
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}