import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  RefreshCw,
  Search,
  Car,
  Calendar,
  Info,
  Download,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SmartApoliceFipeProps {
  apolices: any[];
  selectedPolicy: any;
  onPolicyUpdate: (policy: any) => void;
}

export function SmartApoliceFipe({
  apolices,
  selectedPolicy,
  onPolicyUpdate
}: SmartApoliceFipeProps) {

  const [loading, setLoading] = useState(false);

  // Mock data para cálculos FIPE
  const mockFipeData = apolices.map((apolice, index) => ({
    id: apolice.id || index,
    placa: apolice.veiculo?.placa || `ABC${1234 + index}`,
    marca: apolice.veiculo?.marca || 'FIAT',
    modelo: apolice.veiculo?.modelo || 'ARGO',
    ano: apolice.veiculo?.ano_modelo || 2022,
    valor_compra_nf: (Math.random() * 5000000 + 3000000), // entre 30k e 80k
    valor_atual_fipe: (Math.random() * 6000000 + 3500000), // entre 35k e 95k
    data_consulta: new Date().toISOString().split('T')[0],
    codigo_fipe: `001001-${index}`,
    fonte: 'FIPE'
  }));

  // Calcular métricas para cada veículo
  const calculatedData = mockFipeData.map(item => {
    const tabelaPercent = item.valor_compra_nf && item.valor_atual_fipe 
      ? (item.valor_compra_nf / item.valor_atual_fipe) * 100 
      : null;
    
    const valorizacaoPercent = item.valor_compra_nf && item.valor_atual_fipe 
      ? ((item.valor_atual_fipe - item.valor_compra_nf) / item.valor_compra_nf) * 100 
      : null;

    const sinalizador = tabelaPercent 
      ? tabelaPercent >= 95 ? 'A_VISTA' 
        : tabelaPercent >= 70 ? 'FINAN' 
        : 'CONSORCIO'
      : null;

    return {
      ...item,
      tabelaPercent,
      valorizacaoPercent,
      sinalizador
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSinalizadorBadge = (sinalizador: string | null) => {
    if (!sinalizador) return <Badge variant="outline">N/A</Badge>;

    const config = {
      'A_VISTA': { variant: 'default' as const, label: 'À Vista', color: 'bg-green-100 text-green-700' },
      'FINAN': { variant: 'secondary' as const, label: 'Financiamento', color: 'bg-blue-100 text-blue-700' },
      'CONSORCIO': { variant: 'outline' as const, label: 'Consórcio', color: 'bg-orange-100 text-orange-700' }
    };

    const sinalizadorConfig = config[sinalizador as keyof typeof config];
    
    return (
      <Badge variant={sinalizadorConfig.variant} className={sinalizadorConfig.color}>
        {sinalizadorConfig.label}
      </Badge>
    );
  };

  const getValorizacaoIcon = (percent: number | null) => {
    if (!percent) return null;
    return percent >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const handleUpdateFipe = async (itemId: string) => {
    setLoading(true);
    
    // Simular consulta à FIPE
    setTimeout(() => {
      console.log('Atualizando FIPE para item:', itemId);
      setLoading(false);
    }, 2000);
  };

  const handleUpdateAllFipe = async () => {
    setLoading(true);
    
    // Simular consulta em lote
    setTimeout(() => {
      console.log('Atualizando todos os valores FIPE');
      setLoading(false);
    }, 3000);
  };

  // Calcular resumo geral
  const resumoGeral = {
    totalVeiculos: calculatedData.length,
    aVista: calculatedData.filter(item => item.sinalizador === 'A_VISTA').length,
    financiamento: calculatedData.filter(item => item.sinalizador === 'FINAN').length,
    consorcio: calculatedData.filter(item => item.sinalizador === 'CONSORCIO').length,
    valorizacaoMedia: calculatedData
      .filter(item => item.valorizacaoPercent !== null)
      .reduce((sum, item) => sum + (item.valorizacaoPercent || 0), 0) / calculatedData.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FIPE & Cálculos</h1>
          <p className="text-gray-600 mt-1">
            Valorização, tabela FIPE e sinalizadores de compra
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={handleUpdateAllFipe}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Todos
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Cálculos
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">À Vista</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {resumoGeral.aVista}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Financiamento</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {resumoGeral.financiamento}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consórcio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {resumoGeral.consorcio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valorização Média</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercent(resumoGeral.valorizacaoMedia)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explanation Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Como funcionam os cálculos</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Tabela (%):</strong> (Valor Compra NF ÷ Valor Atual FIPE) × 100</p>
                <p><strong>Valorização (%):</strong> ((Valor Atual FIPE - Valor Compra NF) ÷ Valor Compra NF) × 100</p>
                <p><strong>Sinalizador:</strong> ≥95% = À Vista | ≥70% = Financiamento | &lt;70% = Consórcio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Análise FIPE por Veículo ({calculatedData.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Consultar FIPE Manual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calculatedData.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum veículo para análise
              </h3>
              <p className="text-gray-600">
                Importe apólices com informações de veículos para visualizar os cálculos FIPE
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Valor Compra NF</TableHead>
                    <TableHead>Valor Atual FIPE</TableHead>
                    <TableHead>Tabela (%)</TableHead>
                    <TableHead>Valorização (%)</TableHead>
                    <TableHead>Sinalizador</TableHead>
                    <TableHead>Última Consulta</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <p className="font-medium">{item.marca} {item.modelo}</p>
                            <p className="text-sm text-gray-500">{item.ano}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {item.placa}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.valor_compra_nf)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.valor_atual_fipe)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          (item.tabelaPercent || 0) >= 95 
                            ? 'text-green-600' 
                            : (item.tabelaPercent || 0) >= 70 
                            ? 'text-blue-600' 
                            : 'text-orange-600'
                        }`}>
                          {formatPercent(item.tabelaPercent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getValorizacaoIcon(item.valorizacaoPercent)}
                          <span className={`font-medium ${
                            (item.valorizacaoPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercent(item.valorizacaoPercent)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSinalizadorBadge(item.sinalizador)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(item.data_consulta)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateFipe(item.id)}
                            disabled={loading}
                          >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual FIPE Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Consulta Manual FIPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Selecione a marca</option>
                <option value="fiat">FIAT</option>
                <option value="volkswagen">VOLKSWAGEN</option>
                <option value="chevrolet">CHEVROLET</option>
                <option value="toyota">TOYOTA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled>
                <option value="">Selecione o modelo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled>
                <option value="">Selecione o ano</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Consultar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}