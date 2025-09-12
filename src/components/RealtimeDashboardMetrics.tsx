import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Heart, 
  DollarSign, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { formatCurrency } from '@/utils/currencyFormatter';
import { toast } from 'sonner';

interface DashboardMetrics {
  vidasAtivas: number;
  colaboradoresAtivos: number;
  dependentesAtivos: number;
  custoMensal: number;
  custoMedioVida: number;
  vencimentosProximos: number;
  solicitacoesAbertas: {
    total: number;
    pendentesRH: number;
    pendentesAdmin: number;
    aprovadas: number;
    recusadas: number;
  };
  lastUpdate: string;
}

export const RealtimeDashboardMetrics: React.FC = () => {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    vidasAtivas: 0,
    colaboradoresAtivos: 0,
    dependentesAtivos: 0,
    custoMensal: 0,
    custoMedioVida: 0,
    vencimentosProximos: 0,
    solicitacoesAbertas: {
      total: 0,
      pendentesRH: 0,
      pendentesAdmin: 0,
      aprovadas: 0,
      recusadas: 0
    },
    lastUpdate: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [previousMetrics, setPreviousMetrics] = useState<DashboardMetrics | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Atualizando métricas em tempo real...');

      // Salvar métricas anteriores para comparação
      setPreviousMetrics(prev => prev || metrics);

      // Buscar dados atualizados
      const [colaboradoresRes, dependentesRes, solicitacoesRes, apolicesRes] = await Promise.all([
        // Colaboradores ativos
        supabase
          .from('colaboradores')
          .select('custo_mensal', { count: 'exact' })
          .eq('status', 'ativo'),
        
        // Dependentes ativos  
        supabase
          .from('dependentes')
          .select('custo_mensal', { count: 'exact' })
          .eq('status', 'ativo'),
        
        // Solicitações por status
        supabase
          .from('requests')
          .select('status', { count: 'exact' }),
        
        // Apólices para calcular vencimentos
        supabase
          .from('apolices_beneficios')
          .select('fim_vigencia')
          .eq('status', 'ativa')
      ]);

      // Processar dados dos colaboradores
      const colaboradores = colaboradoresRes.data || [];
      const colaboradoresAtivos = colaboradoresRes.count || 0;
      const custoColaboradores = colaboradores.reduce((sum, col) => 
        sum + (col.custo_mensal || 0), 0);

      // Processar dados dos dependentes
      const dependentes = dependentesRes.data || [];
      const dependentesAtivos = dependentesRes.count || 0;
      const custoDependentes = dependentes.reduce((sum, dep) => 
        sum + (dep.custo_mensal || 0), 0);

      // Calcular totais
      const vidasAtivas = colaboradoresAtivos + dependentesAtivos;
      const custoMensal = custoColaboradores + custoDependentes;
      const custoMedioVida = vidasAtivas > 0 ? custoMensal / vidasAtivas : 0;

      // Processar solicitações
      const solicitacoes = solicitacoesRes.data || [];
      const solicitacoesPorStatus = {
        total: solicitacoesRes.count || 0,
        pendentesRH: solicitacoes.filter(s => s.status === 'recebido').length,
        pendentesAdmin: solicitacoes.filter(s => s.status === 'aprovado_rh').length,
        aprovadas: solicitacoes.filter(s => s.status === 'aprovado_adm' || s.status === 'concluido').length,
        recusadas: solicitacoes.filter(s => s.status === 'recusado_rh' || s.status === 'recusado_adm').length
      };

      // Calcular vencimentos próximos (30 dias)
      const hoje = new Date();
      const em30Dias = new Date();
      em30Dias.setDate(hoje.getDate() + 30);
      
      const apolices = apolicesRes.data || [];
      const vencimentosProximos = apolices.filter(apolice => {
        const fimVigencia = new Date(apolice.fim_vigencia);
        return fimVigencia <= em30Dias && fimVigencia >= hoje;
      }).length;

      const newMetrics: DashboardMetrics = {
        vidasAtivas,
        colaboradoresAtivos,
        dependentesAtivos,
        custoMensal,
        custoMedioVida,
        vencimentosProximos,
        solicitacoesAbertas: solicitacoesPorStatus,
        lastUpdate: new Date().toISOString()
      };

      setMetrics(newMetrics);
      console.log('📊 Métricas atualizadas:', newMetrics);

    } catch (error) {
      console.error('💥 Erro ao buscar métricas:', error);
      toast.error('Erro ao atualizar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, metrics]);

  // Carregar métricas iniciais
  useEffect(() => {
    fetchMetrics();
  }, [user?.id]); // Só dependência do user.id para evitar loop

  // Configurar atualizações em tempo real
  useRealtime(fetchMetrics, [
    { table: 'colaboradores', event: '*' },
    { table: 'dependentes', event: '*' },
    { table: 'requests', event: '*' },
    { table: 'apolices_beneficios', event: '*' }
  ]);

  const getTrendIcon = (current: number, previous: number) => {
    if (!previousMetrics) return null;
    
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (!previousMetrics) return null;
    
    const change = current - previous;
    if (change === 0) return null;
    
    return (
      <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? '+' : ''}{change}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informação da última atualização */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Dashboard em Tempo Real</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Última atualização: {new Date(metrics.lastUpdate).toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMetrics()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vidas Ativas */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vidas Ativas</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{metrics.vidasAtivas}</p>
                  {getTrendIcon(metrics.vidasAtivas, previousMetrics?.vidasAtivas || 0)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {metrics.colaboradoresAtivos} colaboradores + {metrics.dependentesAtivos} dependentes
                  </p>
                  {getChangeIndicator(metrics.vidasAtivas, previousMetrics?.vidasAtivas || 0)}
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Custo Mensal */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custo Mensal</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatCurrency(metrics.custoMensal)}</p>
                  {getTrendIcon(metrics.custoMensal, previousMetrics?.custoMensal || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média por vida: {formatCurrency(metrics.custoMedioVida)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Vencimentos Próximos */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencimentos (30 dias)</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-orange-600">{metrics.vencimentosProximos}</p>
                  {getTrendIcon(metrics.vencimentosProximos, previousMetrics?.vencimentosProximos || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Apólices vencendo
                </p>
              </div>
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Solicitações Totais */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitações</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{metrics.solicitacoesAbertas.total}</p>
                  {getTrendIcon(metrics.solicitacoesAbertas.total, previousMetrics?.solicitacoesAbertas.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total no sistema
                </p>
              </div>
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das solicitações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {metrics.solicitacoesAbertas.pendentesRH}
                </p>
                <p className="text-sm text-orange-600">Aguardando RH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {metrics.solicitacoesAbertas.pendentesAdmin}
                </p>
                <p className="text-sm text-purple-600">Aguardando Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {metrics.solicitacoesAbertas.aprovadas}
                </p>
                <p className="text-sm text-green-600">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {metrics.solicitacoesAbertas.recusadas}
                </p>
                <p className="text-sm text-red-600">Recusadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status de conexão */}
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Sistema conectado em tempo real
        </Badge>
      </div>
    </div>
  );
};