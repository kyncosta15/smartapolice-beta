import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SinistrosRelatoriosProps {
  sinistros: any[];
  vehicles: any[];
  policies: ParsedPolicyData[];
}

export function SinistrosRelatorios({ sinistros, vehicles, policies }: SinistrosRelatoriosProps) {
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    seguradora: '',
    status: '',
    tipoEvento: '',
    gravidade: '',
    categoriaVeiculo: '',
    contratoObra: '',
    incluirFinanceiro: true,
    incluirSLA: true,
    incluirDocumentos: true,
    incluirTimeline: false
  });

  const [reportPreview, setReportPreview] = useState<any>(null);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const generatePreview = () => {
    // Mock report data calculation
    const preview = {
      periodo: `${filters.dataInicio || '2025-01-01'} a ${filters.dataFim || '2025-12-31'}`,
      totalEventos: sinistros.length,
      valorReservado: sinistros.reduce((acc, s) => acc + (s.financeiro?.reserva_tecnica || 0), 0),
      indenizacaoPaga: sinistros.reduce((acc, s) => acc + (s.financeiro?.indenizacao_paga || 0), 0),
      gastosReparo: sinistros.reduce((acc, s) => acc + (s.financeiro?.gastos_reparo_pagos || 0), 0),
      slaMedia: 12.5,
      percentualNoPrazo: 85,
      distribuicaoStatus: {
        'ABERTO': 2,
        'EM_ANALISE': 3,
        'EM_REGULACAO': 1,
        'ENCERRADO': 4
      },
      distribuicaoTipo: {
        'COLISAO': 6,
        'ROUBO': 2,
        'FURTO': 1,
        'VIDRO': 1
      },
      porSeguradora: {
        'Porto Seguro': { eventos: 5, valor: 750000 },
        'Bradesco Seguros': { eventos: 3, valor: 450000 },
        'Suhai Seguradora': { eventos: 2, valor: 300000 }
      },
      porCategoria: {
        'PASSEIO': 7,
        'UTILITARIO': 2,
        'CAMINHAO': 1
      }
    };
    
    setReportPreview(preview);
  };

  const exportToPDF = () => {
    // Mock PDF generation
    const reportData = {
      ...filters,
      ...reportPreview,
      sinistros: sinistros.slice(0, 10), // Limited for demo
      vehicles,
      dataGeracao: new Date().toISOString()
    };
    
    console.log('Generating PDF with data:', reportData);
    alert('Relatório PDF gerado com sucesso!\n\nEm um sistema real, o download iniciaria automaticamente.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Relatórios de Sinistros</h2>
        <p className="text-muted-foreground">
          Configure filtros e gere relatórios detalhados em PDF
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    placeholder="Data início"
                  />
                  <Input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    placeholder="Data fim"
                  />
                </div>
              </div>

              {/* Seguradora */}
              <div>
                <Label>Seguradora</Label>
                <Select value={filters.seguradora} onValueChange={(value) => handleFilterChange('seguradora', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as seguradoras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                    <SelectItem value="Bradesco Seguros">Bradesco Seguros</SelectItem>
                    <SelectItem value="Suhai Seguradora">Suhai Seguradora</SelectItem>
                    <SelectItem value="Allianz">Allianz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ABERTO">Aberto</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="EM_REGULACAO">Em Regulação</SelectItem>
                    <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Evento */}
              <div>
                <Label>Tipo de Evento</Label>
                <Select value={filters.tipoEvento} onValueChange={(value) => handleFilterChange('tipoEvento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="COLISAO">Colisão</SelectItem>
                    <SelectItem value="ROUBO">Roubo</SelectItem>
                    <SelectItem value="FURTO">Furto</SelectItem>
                    <SelectItem value="ALAGAMENTO">Alagamento</SelectItem>
                    <SelectItem value="VIDRO">Vidro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria do Veículo */}
              <div>
                <Label>Categoria do Veículo</Label>
                <Select value={filters.categoriaVeiculo} onValueChange={(value) => handleFilterChange('categoriaVeiculo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="PASSEIO">Passeio</SelectItem>
                    <SelectItem value="UTILITARIO">Utilitário</SelectItem>
                    <SelectItem value="CAMINHAO">Caminhão</SelectItem>
                    <SelectItem value="MOTO">Moto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contrato/Obra */}
              <div>
                <Label>Contrato/Obra</Label>
                <Input
                  value={filters.contratoObra}
                  onChange={(e) => handleFilterChange('contratoObra', e.target.value)}
                  placeholder="OBRA-778, CONTRATO-123..."
                />
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <Label>Incluir no Relatório</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirFinanceiro"
                      checked={filters.incluirFinanceiro}
                      onCheckedChange={(checked) => handleFilterChange('incluirFinanceiro', checked)}
                    />
                    <Label htmlFor="incluirFinanceiro" className="text-sm">Dados Financeiros</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirSLA"
                      checked={filters.incluirSLA}
                      onCheckedChange={(checked) => handleFilterChange('incluirSLA', checked)}
                    />
                    <Label htmlFor="incluirSLA" className="text-sm">Métricas de SLA</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirDocumentos"
                      checked={filters.incluirDocumentos}
                      onCheckedChange={(checked) => handleFilterChange('incluirDocumentos', checked)}
                    />
                    <Label htmlFor="incluirDocumentos" className="text-sm">Status dos Documentos</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluirTimeline"
                      checked={filters.incluirTimeline}
                      onCheckedChange={(checked) => handleFilterChange('incluirTimeline', checked)}
                    />
                    <Label htmlFor="incluirTimeline" className="text-sm">Timeline Detalhada</Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button onClick={generatePreview} className="w-full" variant="outline">
                  <PieChart className="h-4 w-4 mr-2" />
                  Gerar Preview
                </Button>
                
                <Button 
                  onClick={exportToPDF} 
                  className="w-full" 
                  disabled={!reportPreview}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {reportPreview ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Eventos</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{reportPreview.totalEventos}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Valor Reservado</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(reportPreview.valorReservado)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">SLA Médio</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{reportPreview.slaMedia}d</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">% No Prazo</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{reportPreview.percentualNoPrazo}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Charts Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportPreview.distribuicaoStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm">{status}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportPreview.distribuicaoTipo).map(([tipo, count]) => (
                        <div key={tipo} className="flex items-center justify-between">
                          <span className="text-sm">{tipo}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Por Seguradora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportPreview.porSeguradora).map(([seguradora, data]) => {
                        const segData = data as {eventos: number, valor: number};
                        return (
                        <div key={seguradora} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{seguradora}</span>
                            <Badge variant="outline">{segData.eventos} eventos</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(segData.valor)}
                          </p>
                        </div>
                      )})}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportPreview.porCategoria).map(([categoria, count]) => (
                        <div key={categoria} className="flex items-center justify-between">
                          <span className="text-sm">{categoria}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações do Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Período</p>
                      <p className="text-sm text-muted-foreground">{reportPreview.periodo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Filtros Aplicados</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filters.seguradora && (
                          <Badge variant="outline" className="text-xs">
                            Seguradora: {filters.seguradora}
                          </Badge>
                        )}
                        {filters.status && (
                          <Badge variant="outline" className="text-xs">
                            Status: {filters.status}
                          </Badge>
                        )}
                        {filters.tipoEvento && (
                          <Badge variant="outline" className="text-xs">
                            Tipo: {filters.tipoEvento}
                          </Badge>
                        )}
                        {filters.contratoObra && (
                          <Badge variant="outline" className="text-xs">
                            Obra: {filters.contratoObra}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure os filtros e clique em "Gerar Preview"</p>
                <p className="text-sm">para visualizar o relatório</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Modelos de Relatório Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Executivo</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Resumo com KPIs principais, gráficos de tendência e performance de SLA
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Usar Template
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Operacional</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Detalhes de cada caso, timeline, documentos e status atual
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Usar Template
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Financeiro</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Foco em valores, reservas, indenizações e custos por seguradora
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Usar Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}