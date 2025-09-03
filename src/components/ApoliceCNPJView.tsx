import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Shield, 
  AlertCircle,
  TrendingUp,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { ApolicesBeneficios } from '@/hooks/useSmartBeneficiosData';

interface ApoliceCNPJViewProps {
  apolices: ApolicesBeneficios[];
  isLoading: boolean;
}

interface CNPJGroup {
  cnpj: string;
  razao_social: string;
  apolices: ApolicesBeneficios[];
  totalVidas: number;
  totalCusto: number;
  statusSummary: {
    ativas: number;
    vencidas: number;
    suspensas: number;
    canceladas: number;
  };
}

export const ApoliceCNPJView = ({ apolices, isLoading }: ApoliceCNPJViewProps) => {
  const [selectedCNPJ, setSelectedCNPJ] = useState<string>('');

  // Agrupar apólices por CNPJ
  const cnpjGroups = useMemo(() => {
    const groups: { [key: string]: CNPJGroup } = {};

    apolices.forEach((apolice) => {
      if (!groups[apolice.cnpj]) {
        groups[apolice.cnpj] = {
          cnpj: apolice.cnpj,
          razao_social: apolice.razao_social,
          apolices: [],
          totalVidas: 0,
          totalCusto: 0,
          statusSummary: {
            ativas: 0,
            vencidas: 0,
            suspensas: 0,
            canceladas: 0
          }
        };
      }

      const group = groups[apolice.cnpj];
      group.apolices.push(apolice);
      group.totalVidas += apolice.quantidade_vidas || 0;
      group.totalCusto += apolice.valor_total || 0;
      
      // Contar status
      switch (apolice.status) {
        case 'ativa':
          group.statusSummary.ativas++;
          break;
        case 'vencida':
          group.statusSummary.vencidas++;
          break;
        case 'suspensa':
          group.statusSummary.suspensas++;
          break;
        case 'cancelada':
          group.statusSummary.canceladas++;
          break;
      }
    });

    return Object.values(groups).sort((a, b) => a.razao_social.localeCompare(b.razao_social));
  }, [apolices]);

  const getStatusBadge = (status: string) => {
    const config = {
      ativa: { color: 'bg-green-100 text-green-800', label: 'Ativa' },
      vencida: { color: 'bg-red-100 text-red-800', label: 'Vencida' },
      suspensa: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspensa' },
      cancelada: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' }
    };

    const { color, label } = config[status as keyof typeof config] || config.ativa;
    return <Badge className={color}>{label}</Badge>;
  };

  const getTipoBeneficioIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'saude':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'odontologico':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'vida':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const isVencimentoProximo = (fimVigencia: string) => {
    const hoje = new Date();
    const vencimento = new Date(fimVigencia);
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 30 && diasRestantes > 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando apólices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cnpjGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Apólices por CNPJ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma apólice encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Ainda não há apólices cadastradas no sistema
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Apólice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Apólices por CNPJ
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {cnpjGroups.length} CNPJ{cnpjGroups.length !== 1 ? 's' : ''} com {apolices.length} apólice{apolices.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCNPJ || cnpjGroups[0]?.cnpj} onValueChange={setSelectedCNPJ}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(cnpjGroups.length, 4)}, 1fr)` }}>
            {cnpjGroups.slice(0, 4).map((group) => (
              <TabsTrigger key={group.cnpj} value={group.cnpj} className="text-xs">
                {group.cnpj}
              </TabsTrigger>
            ))}
          </TabsList>

          {cnpjGroups.map((group) => (
            <TabsContent key={group.cnpj} value={group.cnpj} className="mt-6">
              {/* Resumo do CNPJ */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{group.razao_social}</h3>
                    <p className="text-muted-foreground">CNPJ: {group.cnpj}</p>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Apólice
                  </Button>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Vidas</p>
                          <p className="text-2xl font-bold">{group.totalVidas}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Custo Total</p>
                          <p className="text-2xl font-bold">{formatCurrency(group.totalCusto)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Apólices Ativas</p>
                          <p className="text-2xl font-bold">{group.statusSummary.ativas}</p>
                        </div>
                        <Shield className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Alertas</p>
                          <p className="text-2xl font-bold">{group.statusSummary.vencidas + group.statusSummary.suspensas}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Lista de apólices */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Apólices ({group.apolices.length})</h4>
                
                {group.apolices.map((apolice) => (
                  <Card key={apolice.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            {getTipoBeneficioIcon(apolice.tipo_beneficio)}
                            <h5 className="font-semibold">{apolice.tipo_beneficio.toUpperCase()}</h5>
                            {getStatusBadge(apolice.status)}
                            {isVencimentoProximo(apolice.fim_vigencia) && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Vence em breve
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Seguradora</p>
                              <p className="font-medium">{apolice.seguradora}</p>
                            </div>
                            
                            <div>
                              <p className="text-muted-foreground">Nº Apólice</p>
                              <p className="font-medium">{apolice.numero_apolice}</p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Vigência</p>
                              <p className="font-medium">
                                {new Date(apolice.inicio_vigencia).toLocaleDateString('pt-BR')} até{' '}
                                {new Date(apolice.fim_vigencia).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Vidas</p>
                              <p className="font-medium">{apolice.quantidade_vidas || 0}</p>
                            </div>

                            {apolice.valor_total && (
                              <div>
                                <p className="text-muted-foreground">Valor Total</p>
                                <p className="font-medium">{formatCurrency(apolice.valor_total)}</p>
                              </div>
                            )}

                            {apolice.valor_empresa && (
                              <div>
                                <p className="text-muted-foreground">Valor Empresa</p>
                                <p className="font-medium">{formatCurrency(apolice.valor_empresa)}</p>
                              </div>
                            )}

                            {apolice.valor_colaborador && (
                              <div>
                                <p className="text-muted-foreground">Valor Colaborador</p>
                                <p className="font-medium">{formatCurrency(apolice.valor_colaborador)}</p>
                              </div>
                            )}
                          </div>

                          {apolice.observacoes && (
                            <div>
                              <p className="text-muted-foreground text-sm">Observações</p>
                              <p className="text-sm">{apolice.observacoes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};