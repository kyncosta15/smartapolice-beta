
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Building2,
  Users,
  FileText,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface PolicyData {
  id: string;
  name: string;
  insurer: string;
  type: string;
  policyNumber: string;
  category: string;
  entity: string;
  premium: number;
  monthlyAmount: number;
  paymentForm: string;
  installments: number;
  startDate: string;
  endDate: string;
  status: string;
  coverage: string[];
  deductible?: number;
  limits?: string;
}

interface DashboardData {
  total_apolices: number;
  custo_mensal_total: number;
  valor_total_segurado: number;
  seguradoras: Record<string, { qtd: number; custo_total: number }>;
  tipos: Record<string, { qtd: number; custo_total: number }>;
  vencimentos: {
    proximos_30_dias: number;
    proximos_60_dias: number;
    proximos_90_dias: number;
  };
  status_distribution: Record<string, number>;
  insights: string[];
  monthly_evolution: Array<{ month: string; cost: number }>;
  high_value_policies: PolicyData[];
  expiring_soon: PolicyData[];
}

interface EnhancedDashboardProps {
  policies: PolicyData[];
}

export const EnhancedDashboard = ({ policies }: EnhancedDashboardProps) => {
  const calculateDashboardData = (): DashboardData => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    const seguradoras: Record<string, { qtd: number; custo_total: number }> = {};
    const tipos: Record<string, { qtd: number; custo_total: number }> = {};
    const status_distribution: Record<string, number> = {};
    
    let custo_mensal_total = 0;
    let valor_total_segurado = 0;
    let vencimentos_30 = 0;
    let vencimentos_60 = 0;
    let vencimentos_90 = 0;

    const insights: string[] = [];
    const high_value_policies: PolicyData[] = [];
    const expiring_soon: PolicyData[] = [];

    policies.forEach(policy => {
      // Seguradoras
      if (!seguradoras[policy.insurer]) {
        seguradoras[policy.insurer] = { qtd: 0, custo_total: 0 };
      }
      seguradoras[policy.insurer].qtd++;
      seguradoras[policy.insurer].custo_total += policy.monthlyAmount;

      // Tipos
      if (!tipos[policy.type]) {
        tipos[policy.type] = { qtd: 0, custo_total: 0 };
      }
      tipos[policy.type].qtd++;
      tipos[policy.type].custo_total += policy.monthlyAmount;

      // Status
      status_distribution[policy.status] = (status_distribution[policy.status] || 0) + 1;

      // Custos
      custo_mensal_total += policy.monthlyAmount;
      valor_total_segurado += policy.premium;

      // Vencimentos
      const endDate = new Date(policy.endDate);
      if (endDate <= thirtyDaysFromNow) {
        vencimentos_30++;
        expiring_soon.push(policy);
      } else if (endDate <= sixtyDaysFromNow) {
        vencimentos_60++;
      } else if (endDate <= ninetyDaysFromNow) {
        vencimentos_90++;
      }

      // Apólices de alto valor
      if (policy.monthlyAmount > 1000) {
        high_value_policies.push(policy);
      }
    });

    // Gerar insights
    const avgMonthlyCost = custo_mensal_total / policies.length;
    const highCostPolicies = policies.filter(p => p.monthlyAmount > avgMonthlyCost * 1.5);
    
    if (highCostPolicies.length > 0) {
      insights.push(`${highCostPolicies.length} apólices acima da média de custo`);
    }

    if (vencimentos_30 > 0) {
      insights.push(`${vencimentos_30} apólices vencendo nos próximos 30 dias`);
    }

    const duplicatedInsurers = Object.entries(seguradoras).filter(([_, data]) => data.qtd > 1);
    if (duplicatedInsurers.length > 0) {
      insights.push(`Possível duplicação em ${duplicatedInsurers.length} seguradoras`);
    }

    // Evolução mensal (mock data baseado nas apólices atuais)
    const monthly_evolution = [
      { month: 'Jan', cost: custo_mensal_total * 0.8 },
      { month: 'Fev', cost: custo_mensal_total * 0.85 },
      { month: 'Mar', cost: custo_mensal_total * 0.9 },
      { month: 'Abr', cost: custo_mensal_total * 0.95 },
      { month: 'Mai', cost: custo_mensal_total },
    ];

    return {
      total_apolices: policies.length,
      custo_mensal_total,
      valor_total_segurado,
      seguradoras,
      tipos,
      vencimentos: {
        proximos_30_dias: vencimentos_30,
        proximos_60_dias: vencimentos_60,
        proximos_90_dias: vencimentos_90,
      },
      status_distribution,
      insights,
      monthly_evolution,
      high_value_policies: high_value_policies.slice(0, 5),
      expiring_soon: expiring_soon.slice(0, 5),
    };
  };

  const dashboardData = calculateDashboardData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expiring': return 'bg-orange-100 text-orange-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Auto',
      vida: 'Vida',
      saude: 'Saúde',
      empresarial: 'Empresarial',
      patrimonial: 'Patrimonial'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-8">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Apólices</CardTitle>
            <Shield className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{dashboardData.total_apolices}</div>
            <p className="text-xs text-blue-600 mt-1">Apólices ativas gerenciadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Custo Mensal</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              R$ {dashboardData.custo_mensal_total.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-green-600 mt-1">Gasto total mensal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Valor Segurado</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              R$ {(dashboardData.valor_total_segurado / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-purple-600 mt-1">Patrimônio total segurado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Vencimentos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {dashboardData.vencimentos.proximos_30_dias}
            </div>
            <p className="text-xs text-orange-600 mt-1">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="insurers">Seguradoras</TabsTrigger>
          <TabsTrigger value="expiring">Vencimentos</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution by Type */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Distribuição por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.tipos).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{getTypeLabel(type)}</Badge>
                        <span className="text-sm text-gray-600">{data.qtd} apólices</span>
                      </div>
                      <div className="text-sm font-medium">
                        R$ {data.custo_total.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Status das Apólices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData.status_distribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={getStatusColor(status)}>
                        {status === 'active' ? 'Ativa' : 
                         status === 'expiring' ? 'Vencendo' : 
                         status === 'expired' ? 'Vencida' : 'Em Análise'}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insurers" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Análise por Seguradora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(dashboardData.seguradoras)
                  .sort(([,a], [,b]) => b.custo_total - a.custo_total)
                  .map(([insurer, data]) => (
                  <div key={insurer} className="p-4 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{insurer}</h4>
                      <Badge variant="outline">{data.qtd} apólices</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Custo mensal total</span>
                      <span className="font-medium">R$ {data.custo_total.toLocaleString('pt-BR')}</span>
                    </div>
                    <Progress 
                      value={(data.custo_total / dashboardData.custo_mensal_total) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Cronograma de Vencimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Próximos 30 dias</span>
                    <Badge variant="destructive">{dashboardData.vencimentos.proximos_30_dias}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">30-60 dias</span>
                    <Badge className="bg-orange-100 text-orange-700">{dashboardData.vencimentos.proximos_60_dias}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">60-90 dias</span>
                    <Badge className="bg-yellow-100 text-yellow-700">{dashboardData.vencimentos.proximos_90_dias}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Apólices Vencendo em Breve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.expiring_soon.map((policy) => (
                    <div key={policy.id} className="p-3 border rounded-lg bg-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{policy.name}</p>
                          <p className="text-xs text-gray-500">{policy.insurer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Vence em</p>
                          <p className="text-sm font-medium">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Insights Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-blue-50/50 rounded-lg">
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Apólices de Alto Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.high_value_policies.map((policy) => (
                    <div key={policy.id} className="p-3 border rounded-lg bg-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{policy.name}</p>
                          <p className="text-xs text-gray-500">{policy.insurer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            R$ {policy.monthlyAmount.toLocaleString('pt-BR')}/mês
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
