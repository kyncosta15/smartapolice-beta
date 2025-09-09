import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, DollarSign, Heart, FileText, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';


interface Colaborador {
  id: string;
  nome: string;
  cpf?: string;
  centro_custo?: string;
  custo_mensal?: number;
  status: string;
}

interface Ticket {
  id: string;
  status: string;
}

interface Apolice {
  id: string;
  tipo_beneficio: string;
  seguradora: string;
  fim_vigencia: string;
}

interface DynamicChartsProps {
  colaboradores: Colaborador[];
  dependentes: any[];
  tickets: Ticket[];
  apolices: Apolice[];
  metrics: {
    vidasAtivas: number;
    custoMensal: number;
    custoMedioVida: number;
    ticketsAbertos: number;
    colaboradoresAtivos: number;
    dependentesAtivos: number;
  };
}

export const DynamicCharts: React.FC<DynamicChartsProps> = ({
  colaboradores,
  dependentes,
  tickets,
  apolices,
  metrics
}) => {
  // Calcular dados para gráficos dinâmicos
  const totalVidas = metrics.colaboradoresAtivos + metrics.dependentesAtivos;
  const custoMedioFormatted = metrics.custoMedioVida || 0;
  
  // Calcular vencimentos próximos (apólices que vencem em 30 dias)
  const vencimentosProximos = apolices.filter(apolice => {
    const fimVigencia = new Date(apolice.fim_vigencia);
    const hoje = new Date();
    const diffTime = fimVigencia.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  // Agrupar colaboradores por centro de custo
  const centrosCusto: Record<string, { count: number; custo: number }> = {};
  
  colaboradores.forEach(col => {
    const centro = col.centro_custo || 'Não definido';
    if (!centrosCusto[centro]) {
      centrosCusto[centro] = { count: 0, custo: 0 };
    }
    centrosCusto[centro].count += 1;
    centrosCusto[centro].custo += col.custo_mensal || 0;
  });

  const centrosCustoArray = Object.entries(centrosCusto)
    .map(([nome, data]) => ({
      name: nome,
      valor: data.custo,
      count: data.count,
      cor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // Status dos tickets para gráfico de rosca
  const statusTickets: Record<string, number> = {};
  
  tickets.forEach(ticket => {
    const status = ticket.status;
    statusTickets[status] = (statusTickets[status] || 0) + 1;
  });

  const statusData = [
    { name: 'Aprovados', value: statusTickets.aprovado || 0, color: '#10b981' },
    { name: 'Em análise', value: statusTickets.em_validacao || 0, color: '#f59e0b' },
    { name: 'Abertos', value: statusTickets.aberto || 0, color: '#3b82f6' },
    { name: 'Processando', value: statusTickets.processando || 0, color: '#8b5cf6' },
    { name: 'Rejeitados', value: statusTickets.rejeitado || 0, color: '#ef4444' }
  ];

  const totalTickets = statusData.reduce((sum, item) => sum + item.value, 0);


  // Calcular porcentagem de crescimento (mock - pode ser calculado com dados históricos)
  const crescimentoVidas = totalVidas > 0 ? 2.5 : 0;
  const variacaoCusto = metrics.custoMensal > 0 ? -1.2 : 0;

  return (
    <>
      {/* Cards com distribuição por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vencimentos Próximos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Vencimentos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vencimentosProximos.length > 0 ? (
                vencimentosProximos.slice(0, 3).map((apolice, index) => {
                  const fimVigencia = new Date(apolice.fim_vigencia);
                  const hoje = new Date();
                  const diffDays = Math.ceil((fimVigencia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                      diffDays <= 7 ? 'bg-red-50' : diffDays <= 15 ? 'bg-yellow-50' : 'bg-blue-50'
                    }`}>
                      <div>
                        <p className="font-medium text-sm">{apolice.tipo_beneficio} - {apolice.seguradora}</p>
                        <p className="text-xs text-muted-foreground">Vence em {diffDays} dias</p>
                      </div>
                      <Badge className={`text-xs ${
                        diffDays <= 7 ? 'bg-red-100 text-red-800' : 
                        diffDays <= 15 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {diffDays <= 7 ? 'Urgente' : diffDays <= 15 ? 'Atenção' : 'Normal'}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum vencimento próximo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                {totalTickets > 0 ? (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(${statusData.map((item, index) => {
                          const percentage = (item.value / totalTickets) * 100;
                          const prevPercentage = statusData.slice(0, index).reduce((sum, prev) => sum + (prev.value / totalTickets) * 100, 0);
                          return `${item.color} ${prevPercentage}% ${prevPercentage + percentage}%`;
                        }).join(', ')})`
                      }}
                    />
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">{totalTickets}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-400">0</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {statusData.filter(item => item.value > 0).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
              {statusData.every(item => item.value === 0) && (
                <p className="text-sm text-muted-foreground text-center">Nenhum ticket encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Centros de Custo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custos por Centro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {centrosCustoArray.length > 0 ? (
                centrosCustoArray.map((item, index) => {
                  const maxCusto = Math.max(...centrosCustoArray.map(c => c.valor));
                  const percentage = maxCusto > 0 ? (item.valor / maxCusto) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.valor)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              backgroundColor: item.cor,
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.count} colaborador{item.count !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum centro de custo definido</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
};