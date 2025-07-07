
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
      const quantidadeParcelas = (policy as any).quantidade_parcelas || 12; // Fallback para 12 parcelas
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
    <Card className="bg-white border-0 shadow-none">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Evolução de Custos Mensais
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {hasData 
                  ? `Baseado no custo mensal real das apólices - ${policies.length} apólice${policies.length !== 1 ? 's' : ''}`
                  : 'Aguardando dados de apólices para análise'
                }
              </p>
            </div>
          </div>
          
          {hasData && (
            <div className="flex space-x-4 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Média Mensal</p>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(avgCusto)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Pico</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(maxCusto)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#e2e8f0' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#e2e8f0' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => hasData ? formatCurrency(value, { 
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  showSymbol: false
                }) : '0'}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  hasData ? formatCurrency(value) : 'Sem dados',
                  'Custo Mensal Real'
                ]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Faça upload de PDFs para ver a evolução mensal</p>
              </div>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Custos Mensais Reais</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Os valores mostrados são baseados no campo "custo_mensal" extraído diretamente das apólices processadas.
                  Cada apólice contribui com seu custo mensal real para o período em que está ativa.
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
