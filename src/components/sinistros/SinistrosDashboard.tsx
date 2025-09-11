import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';

interface SinistrosDashboardProps {
  sinistros: any[];
  vehicles: any[];
  policies: ParsedPolicyData[];
}

export function SinistrosDashboard({ sinistros, vehicles, policies }: SinistrosDashboardProps) {
  // Calculate KPIs
  const totalSinistros = sinistros.length;
  const sinistrosAbertos = sinistros.filter(s => ['ABERTO', 'EM_ANALISE', 'EM_REGULACAO'].includes(s.status)).length;
  const sinistrosEncerrados = sinistros.filter(s => s.status === 'ENCERRADO').length;
  
  const valorReservado = sinistros.reduce((acc, s) => acc + (s.financeiro?.reserva_tecnica || 0), 0);
  const indenizacaoPaga = sinistros.reduce((acc, s) => acc + (s.financeiro?.indenizacao_paga || 0), 0);
  const gastosReparo = sinistros.reduce((acc, s) => acc + (s.financeiro?.gastos_reparo_pagos || 0), 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSinistros}</div>
            <p className="text-xs text-muted-foreground">
              {sinistrosAbertos} abertos, {sinistrosEncerrados} encerrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Reservado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorReservado)}</div>
            <p className="text-xs text-muted-foreground">
              Reserva técnica total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indenização Paga</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(indenizacaoPaga)}</div>
            <p className="text-xs text-muted-foreground">
              Valores já quitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos de Reparo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(gastosReparo)}</div>
            <p className="text-xs text-muted-foreground">
              Reparos executados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance de SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SLA Médio</span>
              <Badge variant="outline">12 dias</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">% Encerrados no Prazo</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ticket Médio</span>
              <Badge variant="outline">{formatCurrency(250000)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SLA Ultrapassado</span>
              <Badge variant="destructive">2 casos</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Documentação Pendente</span>
              <Badge variant="secondary">5 casos</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CRLV Vencendo</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                3 veículos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Casos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sinistros.slice(0, 5).map((sinistro) => (
              <div key={sinistro.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(sinistro.status)} text-white`}>
                    {getStatusLabel(sinistro.status)}
                  </Badge>
                  <div>
                    <p className="font-medium">{sinistro.ticket_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {sinistro.veiculo?.placa} • {getEventTypeLabel(sinistro.tipo_evento)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(sinistro.financeiro?.reserva_tecnica || 0)}</p>
                  <p className="text-sm text-muted-foreground">{sinistro.data_abertura}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['ABERTO', 'EM_ANALISE', 'EM_REGULACAO', 'ENCERRADO'].map((status) => {
              const count = sinistros.filter(s => s.status === status).length;
              return (
                <div key={status} className="text-center p-3 border rounded-lg">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(status)} mx-auto mb-2`}></div>
                  <p className="text-sm font-medium">{getStatusLabel(status)}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}