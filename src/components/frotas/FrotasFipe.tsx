import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calculator,
  DollarSign
} from 'lucide-react';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';

interface FrotasFipeProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
}

export function FrotasFipe({ veiculos, loading }: FrotasFipeProps) {
  // Filtrar apenas veículos com dados FIPE e NF
  const veiculosComFipe = veiculos.filter(v => v.preco_fipe && v.preco_nf);

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    if (veiculosComFipe.length === 0) return null;

    const valorizacoes = veiculosComFipe.map(v => {
      const diferenca = v.preco_fipe! - v.preco_nf!;
      const percentual = (diferenca / v.preco_nf!) * 100;
      return { diferenca, percentual };
    });

    const totalValorizacao = valorizacoes.reduce((acc, v) => acc + v.diferenca, 0);
    const mediaPercentual = valorizacoes.reduce((acc, v) => acc + v.percentual, 0) / valorizacoes.length;
    
    const positivos = valorizacoes.filter(v => v.diferenca > 0).length;
    const negativos = valorizacoes.filter(v => v.diferenca < 0).length;
    const neutros = valorizacoes.filter(v => v.diferenca === 0).length;

    return {
      totalValorizacao,
      mediaPercentual,
      positivos,
      negativos,
      neutros,
      totalVeiculos: veiculosComFipe.length
    };
  }, [veiculosComFipe]);

  const getValorizacaoIcon = (preco_fipe: number, preco_nf: number) => {
    const diferenca = preco_fipe - preco_nf;
    if (diferenca > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (diferenca < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getValorizacaoBadge = (preco_fipe: number, preco_nf: number) => {
    const diferenca = preco_fipe - preco_nf;
    const percentual = (diferenca / preco_nf) * 100;
    
    if (diferenca > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          +{percentual.toFixed(1)}%
        </Badge>
      );
    } else if (diferenca < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          {percentual.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          0%
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Loading */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas FIPE */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valorização Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalValorizacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalValorizacao)}
              </div>
              <p className="text-xs text-gray-500">
                diferença FIPE vs NF
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Média Percentual
              </CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.mediaPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.mediaPercentual.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                valorização média
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valorizados
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.positivos}
              </div>
              <p className="text-xs text-gray-500">
                de {stats.totalVeiculos} veículos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Desvalorizados
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.negativos}
              </div>
              <p className="text-xs text-gray-500">
                de {stats.totalVeiculos} veículos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Análise FIPE */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise FIPE ({veiculosComFipe.length} veículos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {veiculosComFipe.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum dado FIPE disponível
              </h3>
              <p className="text-gray-500">
                Para exibir a análise FIPE, é necessário ter veículos com dados de preço FIPE e valor da NF.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Valor NF</TableHead>
                    <TableHead>Preço FIPE</TableHead>
                    <TableHead>Diferença</TableHead>
                    <TableHead>Valorização</TableHead>
                    <TableHead>% Tabela</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculosComFipe.map((veiculo) => {
                    const diferenca = veiculo.preco_fipe! - veiculo.preco_nf!;
                    const percentualTabela = veiculo.percentual_tabela 
                      ? (veiculo.percentual_tabela * 100).toFixed(1) + '%'
                      : '-';

                    return (
                      <TableRow key={veiculo.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {veiculo.marca} {veiculo.modelo}
                            </div>
                            {veiculo.ano_modelo && (
                              <div className="text-sm text-gray-500">
                                {veiculo.ano_modelo}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono font-medium">
                            {veiculo.placa}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(veiculo.preco_nf!)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-blue-600">
                            {formatCurrency(veiculo.preco_fipe!)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className={`font-medium flex items-center gap-2 ${
                            diferenca >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {getValorizacaoIcon(veiculo.preco_fipe!, veiculo.preco_nf!)}
                            {formatCurrency(Math.abs(diferenca))}
                          </div>
                        </TableCell>

                        <TableCell>
                          {getValorizacaoBadge(veiculo.preco_fipe!, veiculo.preco_nf!)}
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-purple-600">
                            {percentualTabela}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}