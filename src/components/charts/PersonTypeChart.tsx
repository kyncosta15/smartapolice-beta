
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2 } from 'lucide-react';
import { PolicyData } from './chartData';

interface PersonTypeChartProps {
  policies: PolicyData[];
}

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

  const hasData = policies.length > 0;

  return (
    <div className="w-full space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Distribuição por Tipo de Cliente</h3>
        <p className="text-sm text-gray-600">
          {hasData 
            ? `${personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica} de ${policies.length} apólices classificadas`
            : 'Aguardando dados de apólices'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Pessoa Física */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Users className="h-4 w-4 text-blue-600" />
              Pessoa Física
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {personTypeDistribution.pessoaFisica}
            </div>
            <p className="text-sm text-gray-500">
              {personTypeDistribution.pessoaFisica === 1 ? 'apólice' : 'apólices'}
            </p>
          </CardContent>
        </Card>

        {/* Card Pessoa Jurídica */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Building2 className="h-4 w-4 text-purple-600" />
              Pessoa Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {personTypeDistribution.pessoaJuridica}
            </div>
            <p className="text-sm text-gray-500">
              {personTypeDistribution.pessoaJuridica === 1 ? 'apólice' : 'apólices'}
            </p>
          </CardContent>
        </Card>
      </div>

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Users className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-center text-sm">
            Carregue apólices para ver a distribuição por tipo de cliente
          </p>
        </div>
      )}
    </div>
  );
};
