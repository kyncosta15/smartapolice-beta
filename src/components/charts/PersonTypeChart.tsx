
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2 } from 'lucide-react';
import { PolicyData } from './chartData';

interface PersonTypeChartProps {
  policies: PolicyData[];
}

const chartConfig = {
  count: {
    label: "Quantidade de Apólices",
    color: "hsl(var(--chart-1))",
  },
} as const;

export const PersonTypeChart = ({ policies }: PersonTypeChartProps) => {
  // Função para extrair valor do campo do N8N
  const extractValue = (field: any): string | null => {
    if (!field) return null;
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field.value) return field.value;
    return null;
  };

  // Classificar apólices por tipo de pessoa
  const personTypeDistribution = policies.reduce((acc, policy) => {
    const documentoTipo = extractValue(policy.documento_tipo);
    
    if (documentoTipo && documentoTipo !== 'undefined') {
      const tipoDocumento = documentoTipo.toString().toUpperCase().trim();
      
      if (tipoDocumento === 'CPF') {
        acc.pessoaFisica++;
      } else if (tipoDocumento === 'CNPJ') {
        acc.pessoaJuridica++;
      }
    }
    
    return acc;
  }, { pessoaFisica: 0, pessoaJuridica: 0 });

  const chartData = [
    {
      name: 'Pessoa Física',
      count: personTypeDistribution.pessoaFisica,
      fill: '#3b82f6',
      icon: Users
    },
    {
      name: 'Pessoa Jurídica', 
      count: personTypeDistribution.pessoaJuridica,
      fill: '#8b5cf6',
      icon: Building2
    }
  ];

  const hasData = policies.length > 0;
  const totalPolicies = personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-blue-600" />
          Distribuição por Tipo de Cliente
        </CardTitle>
        <p className="text-sm text-gray-600">
          {hasData 
            ? `${totalPolicies} de ${policies.length} apólices classificadas`
            : 'Aguardando dados de apólices'
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumo em cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {chartData.map((item) => {
              const IconComponent = item.icon;
              const percentage = totalPolicies > 0 ? (item.count / totalPolicies * 100).toFixed(1) : '0';
              
              return (
                <div key={item.name} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.fill}20` }}>
                      <IconComponent className="h-4 w-4" style={{ color: item.fill }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-2xl font-bold" style={{ color: item.fill }}>
                        {item.count}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}% do total</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico de barras */}
          {hasData && totalPolicies > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => [
                          `${value} apólice${value !== 1 ? 's' : ''}`,
                          name
                        ]}
                      />
                    }
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    fill="currentColor"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <Users className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-center">
                {!hasData 
                  ? 'Carregue apólices para ver a distribuição por tipo de cliente'
                  : 'Nenhuma apólice foi classificada ainda'
                }
              </p>
              {hasData && totalPolicies === 0 && (
                <p className="text-xs text-center mt-2">
                  Verifique se as apólices possuem o campo documento_tipo preenchido
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
