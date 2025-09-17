import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar
} from 'lucide-react';

// Types
type Sinistro = {
  id: string;
  status: string;
  created_at: string;
  closed_at?: string | null;
  seguradora?: string | null;
  ticket_id?: string;
  tipo_evento?: string;
  veiculo?: {
    placa?: string;
  };
  data_abertura?: string;
  financeiro?: {
    reserva_tecnica?: number;
  };
};

// Constants for status categorization
const OPEN_STATUSES = ['aberto', 'em_analise', 'em_regulacao', 'ABERTO', 'EM_ANALISE', 'EM_REGULACAO'];
const CLOSED_STATUSES = ['encerrado', 'finalizado', 'pago', 'ENCERRADO', 'FINALIZADO', 'PAGO'];

// KPI calculation function
function kpisFrom(sinistros: Sinistro[], now = new Date()) {
  const total = sinistros.length;
  const emAberto = sinistros.filter(s =>
    OPEN_STATUSES.includes(s.status)
  ).length;
  const finalizados = sinistros.filter(s =>
    CLOSED_STATUSES.includes(s.status) || !!s.closed_at
  ).length;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 60);
  const ult60d = sinistros.filter(s => new Date(s.created_at) >= cutoff).length;
  return { total, emAberto, finalizados, ult60d };
}

interface SinistrosDashboardProps {
  sinistros: Sinistro[];
  vehicles: any[];
  policies: ParsedPolicyData[];
  loading?: boolean;
}

export function SinistrosDashboard({ sinistros = [], vehicles, policies, loading = false }: SinistrosDashboardProps) {
  // Calculate KPIs using the new function
  const kpis = kpisFrom(sinistros);

  const getStatusColor = (status: string) => {
    const colors = {
      'ABERTO': 'bg-blue-500',
      'EM_ANALISE': 'bg-yellow-500',
      'DOCUMENTACAO_PENDENTE': 'bg-orange-500',
      'EM_REGULACAO': 'bg-purple-500',
      'EM_REPARO': 'bg-indigo-500',
      'AGUARDANDO_PAGAMENTO': 'bg-cyan-500',
      'ENCERRADO': 'bg-green-500',
      'CANCELADO': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'ABERTO': 'Aberto',
      'EM_ANALISE': 'Em Análise',
      'DOCUMENTACAO_PENDENTE': 'Doc. Pendente',
      'EM_REGULACAO': 'Em Regulação',
      'EM_REPARO': 'Em Reparo',
      'AGUARDANDO_PAGAMENTO': 'Aguard. Pagamento',
      'ENCERRADO': 'Encerrado',
      'CANCELADO': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'COLISAO': 'Colisão',
      'ROUBO': 'Roubo',
      'FURTO': 'Furto',
      'ALAGAMENTO': 'Alagamento',
      'INCENDIO': 'Incêndio',
      'VIDRO': 'Vidro',
      'TERCEIROS': 'Terceiros',
      'OUTRO': 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      {/* New 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Sinistros */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sinistros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`Total de ${kpis.total} sinistros`} title={`Total: ${kpis.total} sinistros`}>
              {kpis.total}
            </div>
            <p className="text-xs text-muted-foreground">
              total
            </p>
          </CardContent>
        </Card>

        {/* Em Aberto */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${kpis.emAberto} sinistros em aberto`} title={`Em aberto: ${kpis.emAberto} sinistros`}>
              {kpis.emAberto}
            </div>
            <p className="text-xs text-muted-foreground">
              em aberto
            </p>
          </CardContent>
        </Card>

        {/* Finalizados */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${kpis.finalizados} sinistros finalizados`} title={`Finalizados: ${kpis.finalizados} sinistros`}>
              {kpis.finalizados}
            </div>
            <p className="text-xs text-muted-foreground">
              finalizados
            </p>
          </CardContent>
        </Card>

        {/* Últimos 60 dias */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos 60 dias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${kpis.ult60d} sinistros criados nos últimos 60 dias`} title={`Últimos 60 dias: ${kpis.ult60d} sinistros`}>
              {kpis.ult60d}
            </div>
            <p className="text-xs text-muted-foreground">
              criados nos últimos 60 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Casos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sinistros.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum sinistro encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-4">
                {sinistros.slice(0, 5).map((sinistro) => (
                  <div key={sinistro.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(sinistro.status)} text-white`}>
                        {getStatusLabel(sinistro.status)}
                      </Badge>
                      <div>
                        <p className="font-medium">{sinistro.ticket_id || sinistro.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {sinistro.veiculo?.placa || 'N/A'} • {getEventTypeLabel(sinistro.tipo_evento || 'OUTRO')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(sinistro.financeiro?.reserva_tecnica || 0)}</p>
                      <p className="text-sm text-muted-foreground">{sinistro.data_abertura || sinistro.created_at.split('T')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}