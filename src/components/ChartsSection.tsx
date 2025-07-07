
import { InsurerDistributionChart } from './charts/InsurerDistributionChart';
import { InsuranceTypesChart } from './charts/InsuranceTypesChart';
import { CostEvolutionChart } from './charts/CostEvolutionChart';
import { ExpirationTimelineChart } from './charts/ExpirationTimelineChart';
import { ComparativeAnalysisChart } from './charts/ComparativeAnalysisChart';
import { RecentPoliciesChart } from './charts/RecentPoliciesChart';
import { PolicyData } from './charts/chartData';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface ChartsSectionProps {
  detailed?: boolean;
  policies?: PolicyData[];
}

export const ChartsSection = ({ detailed = false, policies = [] }: ChartsSectionProps) => {
  const hasData = policies && policies.length > 0;

  return (
    <div className="w-full space-y-8">
      {/* Header com indicador de dados */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análise de Dados</h2>
            <p className="text-sm text-gray-600">
              {hasData 
                ? `Baseado em ${policies.length} apólice${policies.length !== 1 ? 's' : ''} cadastrada${policies.length !== 1 ? 's' : ''}`
                : 'Aguardando dados de apólices'
              }
            </p>
          </div>
        </div>
        
        {hasData && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Dados atualizados</span>
          </div>
        )}
      </div>

      {!hasData && (
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-3 bg-orange-50 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma apólice encontrada
            </h3>
            <p className="text-center text-gray-600 mb-4 max-w-md">
              Faça upload de arquivos PDF de apólices para visualizar gráficos e análises detalhadas dos seus dados.
            </p>
            <p className="text-sm text-gray-500">
              Os gráficos serão gerados automaticamente após o processamento dos PDFs
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráficos - organizados verticalmente com espaçamento limpo */}
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <CostEvolutionChart policies={policies} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <RecentPoliciesChart policies={policies} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <InsurerDistributionChart policies={policies} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <InsuranceTypesChart policies={policies} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <ExpirationTimelineChart policies={policies} />
        </div>

        {detailed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            <ComparativeAnalysisChart policies={policies} />
          </div>
        )}
      </div>

      {hasData && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Análise Inteligente</h4>
              <p className="text-sm text-blue-700 mt-1">
                Os dados são processados automaticamente e os gráficos são atualizados em tempo real conforme você adiciona novas apólices.
                A classificação de pessoa física/jurídica é baseada no tipo de documento extraído das apólices.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
