
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { PolicyData } from './chartData';

interface CostEvolutionChartProps {
  policies?: PolicyData[];
}

export const CostEvolutionChart = ({ policies = [] }: CostEvolutionChartProps) => {
  const generateMonthlyData = () => {
    if (!policies || policies.length === 0) {
      return getEmptyMonthlyData();
    }

    // Algoritmo baseado nas especificações do usuário
    const custosMensais: { [key: string]: number } = {};
    
    // Para cada apólice, calcular parcelas mensais
    policies.forEach(policy => {
      // Usar os campos reais da política
      const valorTotal = policy.premium || 0;
      const quantidadeParcelas = (policy as any).quantidade_parcelas || 1; // Fallback para 1 parcela (à vista)
      const dataInicio = new Date(policy.startDate);
      
      if (valorTotal > 0 && quantidadeParcelas > 0) {
        const valorMensal = valorTotal / quantidadeParcelas;
        
        console.log(`💰 Processando ${policy.name}: valor total = R$ ${valorTotal}, parcelas = ${quantidadeParcelas}, valor mensal = R$ ${valorMensal}`);
        
        // Gerar parcelas mensais
        for (let i = 0; i < quantidadeParcelas; i++) {
          const dataParcela = new Date(dataInicio);
          dataParcela.setMonth(dataParcela.getMonth() + i);
          
          const key = `${dataParcela.getFullYear()}-${(dataParcela.getMonth() + 1).toString().padStart(2, '0')}`;
          
          custosMensais[key] = (custosMensais[key] || 0) + valorMensal;
        }
      }
    });

    // Gerar os últimos 12 meses para garantir continuidade no gráfico
    const now = new Date();
    const mesesDesejados: string[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      mesesDesejados.push(key);
    }

    // Transformar para o formato do gráfico
    const resultado = mesesDesejados.map(mesKey => {
      const [year, month] = mesKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const displayMonth = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      return {
        month: displayMonth,
        custo: Math.round((custosMensais[mesKey] || 0) * 100) / 100,
        apolices: Object.keys(custosMensais).includes(mesKey) ? 1 : 0
      };
    });

    return resultado;
  };

  const getMonthNumber = (monthStr: string): number => {
    const months: { [key: string]: number } = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };
    return months[monthStr.toLowerCase()] || 0;
  };

  const getEmptyMonthlyData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months.push({ month, custo: 0, apolices: 0 });
    }
    
    return months;
  };

  const hasData = policies && policies.length > 0;
  const chartData = generateMonthlyData();
  const totalCusto = chartData.reduce((sum, item) => sum + item.custo, 0);
  const maxCusto = Math.max(...chartData.map(item => item.custo));
  const avgCusto = chartData.length > 0 ? totalCusto / chartData.length : 0;

  console.log('📊 Dados do gráfico gerados:', {
    totalCusto,
    maxCusto,
    avgCusto,
    chartData: chartData.slice(0, 3) // Mostrar apenas os primeiros 3 meses para debug
  });

  return (
    <Card className="bg-card border-border print-chart-card">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Evolução de Custos Mensais
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {hasData 
                  ? `Calculado baseado no valor total dividido pelas parcelas - ${policies.length} apólice${policies.length !== 1 ? 's' : ''}`
                  : 'Aguardando dados de apólices para análise'
                }
              </p>
            </div>
          </div>
          
          {hasData && (
            <div className="flex space-x-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Média Mensal</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(avgCusto, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Pico</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(maxCusto, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalCusto, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="chart-root w-full h-80 relative bg-background rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%" className="!bg-transparent">
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--muted-foreground) / 0.25)" 
              />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => hasData ? formatCurrency(value, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  showSymbol: false
                }) : '0'}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  hasData ? formatCurrency(value, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : 'Sem dados',
                  'Valor Calculado (Total ÷ Parcelas)'
                ]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="custo" 
                stroke={hasData ? "#2563eb" : "#e2e8f0"}
                strokeWidth={3}
                dot={{ 
                  fill: hasData ? "#2563eb" : "#e2e8f0", 
                  strokeWidth: 2, 
                  r: 5 
                }}
                activeDot={{ 
                  r: 7, 
                  stroke: hasData ? "#2563eb" : "#e2e8f0", 
                  strokeWidth: 2,
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Faça upload de PDFs para ver a evolução mensal</p>
              </div>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-6 p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Algoritmo de Evolução de Custos</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Os valores são calculados dividindo o valor total das apólices pelo número de parcelas, 
                  distribuindo o custo mensal pelos meses de vigência. 
                  Total de {policies.length} apólice{policies.length !== 1 ? 's' : ''} processada{policies.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
