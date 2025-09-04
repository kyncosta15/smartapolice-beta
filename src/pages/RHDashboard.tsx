import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useRHDashboardData } from '@/hooks/useRHDashboardData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function RHDashboard() {
  const { 
    kpis, 
    renewals, 
    solicitacoesStatus, 
    waterfallData, 
    isLoading, 
    error 
  } = useRHDashboardData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining <= 15) {
      return <Badge variant="destructive">Urgente</Badge>;
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">SmartBenefícios — Portal RH/Financeiro</h1>
        <p className="text-muted-foreground">Dashboard executivo de gestão de benefícios</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Vidas Ativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vidas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.vidasAtivas}</div>
                <p className="text-xs text-muted-foreground">colaboradores ativos</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custo Mensal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(kpis.custoMensal)}</div>
                <p className="text-xs text-muted-foreground">total de benefícios</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custo Médio/Vida */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio/Vida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(kpis.custoMedioVida)}</div>
                <p className="text-xs text-muted-foreground">por colaborador</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tickets Abertos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.ticketsAbertos}</div>
                <p className="text-xs text-muted-foreground">pendentes</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Vencimentos e Status das Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vencimentos Próximos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Vencimentos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : renewals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum vencimento próximo
              </p>
            ) : (
              <div className="space-y-3">
                {renewals.slice(0, 5).map(renewal => (
                  <div key={renewal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{renewal.employee_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {renewal.plan_name} • {formatDate(renewal.end_date)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(renewal.monthly_premium)}
                      </span>
                      {getUrgencyBadge(renewal.days_remaining)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status das Solicitações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Status das Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={solicitacoesStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {solicitacoesStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Waterfall e Cenários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Waterfall */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo: Sem Gestão → Com SmartBenefícios</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar 
                      dataKey="value" 
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cenários */}
        <div className="space-y-4">
          {/* Cenário Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cenário Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Custo Mensal:</span>
                    <span className="font-medium">{formatCurrency(kpis.custoMensal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vidas Ativas:</span>
                    <span className="font-medium">{kpis.vidasAtivas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo/Vida:</span>
                    <span className="font-medium">{formatCurrency(kpis.custoMedioVida)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cenário Projetado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cenário Projetado</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Custo Mensal:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(kpis.custoMensal * 0.76)} {/* 24% de economia */}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vidas Ativas:</span>
                    <span className="font-medium">{kpis.vidasAtivas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(kpis.custoMensal * 0.24)} /mês
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}