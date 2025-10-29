import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { corpClient } from '@/lib/corpClient';
import { getClienteLigacoes } from '@/services/corpnuvem';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ramo {
  codigo: number;
  nome: string;
  abreviatura: string;
}

interface RamoCount {
  nome: string;
  vigentes: number;
  ativas: number;
}

export function SegurosDistribution() {
  const [loading, setLoading] = useState(false);
  const [ramosData, setRamosData] = useState<RamoCount[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const { toast } = useToast();

  // Carregar dados do cache ao montar o componente
  useEffect(() => {
    loadFromCache();
  }, []);

  const loadFromCache = async () => {
    setLoadingCache(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seguros_distribution_cache')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Agrupar por nome_ramo e somar os valores
        const ramosMap = new Map<string, RamoCount>();
        
        data.forEach(item => {
          const existing = ramosMap.get(item.nome_ramo);
          if (existing) {
            existing.vigentes += item.clientes_vigentes;
            existing.ativas += item.clientes_ativas;
          } else {
            ramosMap.set(item.nome_ramo, {
              nome: item.nome_ramo,
              vigentes: item.clientes_vigentes,
              ativas: item.clientes_ativas
            });
          }
        });

        const ramosArray = Array.from(ramosMap.values())
          .sort((a, b) => b.vigentes - a.vigentes);

        setRamosData(ramosArray);
        
        // Pegar a data mais recente
        const mostRecent = data[0];
        setLastUpdate(new Date(mostRecent.updated_at));

        console.log('✅ Dados carregados do cache');
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    } finally {
      setLoadingCache(false);
    }
  };

  const saveToCache = async (ramosArray: RamoCount[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deletar cache antigo do usuário
      await supabase
        .from('seguros_distribution_cache')
        .delete()
        .eq('user_id', user.id);

      // Inserir novos dados
      const cacheData = ramosArray.map(ramo => ({
        user_id: user.id,
        nome_ramo: ramo.nome,
        clientes_vigentes: ramo.vigentes,
        clientes_ativas: ramo.ativas
      }));

      const { error } = await supabase
        .from('seguros_distribution_cache')
        .insert(cacheData);

      if (error) throw error;

      console.log('✅ Dados salvos no cache');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  };

  const handleLoadData = async () => {
    setLoading(true);
    try {
      // 1. Buscar ramos do CorpNuvem
      console.log('🔄 Buscando ramos do CorpNuvem...');
      const ramosResponse = await corpClient.get('/ramos');
      console.log('📦 Resposta ramos:', ramosResponse.data);
      
      const ramos: Ramo[] = ramosResponse.data?.ramos || [];
      
      if (ramos.length === 0) {
        console.warn('⚠️ Nenhum ramo encontrado na API');
        toast({
          title: 'Aviso',
          description: 'Nenhum ramo encontrado na API.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Criar mapa de abreviatura -> nome completo
      const abrevToNomeMap = new Map<string, string>();
      ramos.forEach(ramo => {
        abrevToNomeMap.set(ramo.abreviatura.toUpperCase(), ramo.nome);
      });

      // 2. Buscar todos os clientes
      console.log('🔄 Buscando lista de clientes...');
      const clientesResponse = await corpClient.get('/lista_clientes', {
        params: { texto: '' } // Busca todos os clientes
      });
      
      const clientes = clientesResponse.data?.clientes || [];
      console.log(`📊 Total de clientes encontrados: ${clientes.length}`);

      if (clientes.length === 0) {
        toast({
          title: 'Sem dados',
          description: 'Nenhum cliente encontrado no sistema.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // 3. Para cada ramo, manter sets de clientes únicos
      const ramoClientesMap = new Map<string, {
        nome: string;
        clientesVigentes: Set<number>;
        clientesAtivas: Set<number>;
      }>();

      // Inicializar todos os ramos
      ramos.forEach(ramo => {
        ramoClientesMap.set(ramo.abreviatura.toUpperCase(), {
          nome: ramo.nome,
          clientesVigentes: new Set(),
          clientesAtivas: new Set(),
        });
      });

      // 4. Buscar documentos de cada cliente em lotes
      const BATCH_SIZE = 50; // Processar 50 clientes por vez
      const totalClientes = clientes.length;
      console.log(`🔄 Buscando documentos de ${totalClientes} clientes em lotes de ${BATCH_SIZE}...`);

      setProgress({ current: 0, total: totalClientes });

      const hoje = new Date();
      let processados = 0;

      // Processar em lotes
      for (let batchStart = 0; batchStart < totalClientes; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalClientes);
        const batch = clientes.slice(batchStart, batchEnd);
        
        console.log(`📦 Processando lote ${Math.floor(batchStart / BATCH_SIZE) + 1}: clientes ${batchStart + 1} a ${batchEnd}`);

        // Processar clientes do lote em paralelo
        const batchPromises = batch.map(async (cliente) => {
          try {
            const ligacoes = await getClienteLigacoes(cliente.codigo);
            
            if (ligacoes.documentos?.documentos) {
              return {
                codigo: cliente.codigo,
                documentos: ligacoes.documentos.documentos
              };
            }
          } catch (error) {
            console.error(`Erro ao buscar ligações do cliente ${cliente.codigo}:`, error);
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);

        // Processar resultados do lote
        batchResults.forEach(result => {
          if (result && result.documentos) {
            result.documentos.forEach(doc => {
              const ramoAbrev = doc.ramo.toUpperCase();
              
              let ramoData = ramoClientesMap.get(ramoAbrev);
              
              if (!ramoData) {
                const nomeRamo = abrevToNomeMap.get(ramoAbrev) || ramoAbrev;
                ramoData = {
                  nome: nomeRamo,
                  clientesVigentes: new Set(),
                  clientesAtivas: new Set(),
                };
                ramoClientesMap.set(ramoAbrev, ramoData);
              }

              const fimVigencia = doc.fimvig;
              if (fimVigencia) {
                try {
                  const [dia, mes, ano] = fimVigencia.split('/');
                  const dataFim = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                  
                  if (dataFim >= hoje) {
                    ramoData.clientesVigentes.add(result.codigo);
                  }
                } catch (e) {
                  console.warn('Erro ao parsear data:', fimVigencia);
                }
              }

              if (doc.cancelado === 'F') {
                ramoData.clientesAtivas.add(result.codigo);
              }
            });
          }
        });

        processados = batchEnd;
        setProgress({ current: processados, total: totalClientes });
        console.log(`📊 Processados ${processados}/${totalClientes} clientes (${Math.round(processados / totalClientes * 100)}%)`);

        // Pequeno delay entre lotes para não sobrecarregar a API
        if (batchEnd < totalClientes) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 5. Converter para array e ordenar
      const ramosArray: RamoCount[] = Array.from(ramoClientesMap.entries())
        .map(([abrev, data]) => ({
          nome: data.nome,
          vigentes: data.clientesVigentes.size,
          ativas: data.clientesAtivas.size,
        }))
        .filter(r => r.vigentes > 0 || r.ativas > 0) // Mostrar apenas ramos com clientes
        .sort((a, b) => b.vigentes - a.vigentes);

      setRamosData(ramosArray);

      // Salvar no cache
      await saveToCache(ramosArray);

      setProgress({ current: 0, total: 0 });

      toast({
        title: 'Dados carregados',
        description: `${ramosArray.length} tipos de seguro encontrados de ${processados} clientes`,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a distribuição de seguros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ))}
    </div>
  );

  const totals = ramosData.reduce(
    (acc, ramo) => ({
      vigentes: acc.vigentes + ramo.vigentes,
      ativas: acc.ativas + ramo.ativas,
    }),
    { vigentes: 0, ativas: 0 }
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Distribuição de Clientes por Tipo de Seguro
              </CardTitle>
              <CardDescription>
                Quantidade de clientes com apólices vigentes e ativas por ramo
                {lastUpdate && (
                  <span className="block text-xs mt-1">
                    Última atualização: {format(lastUpdate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={handleLoadData} 
              disabled={loading || loadingCache}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {ramosData.length > 0 ? 'Atualizar Dados' : 'Carregar Distribuição'}
                </>
              )}
            </Button>
            
            {loading && progress.total > 0 && (
              <div className="text-sm text-muted-foreground">
                Processando: {progress.current} de {progress.total} clientes ({Math.round(progress.current / progress.total * 100)}%)
              </div>
            )}
          </div>

          {loadingCache ? (
            renderSkeletons()
          ) : loading ? (
            renderSkeletons()
          ) : ramosData.length > 0 ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 pb-2 border-b font-semibold text-sm">
                <div>Ramo</div>
                <div className="text-right">Vigentes</div>
                <div className="text-right">Ativas</div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2">
                {ramosData.map((ramo, idx) => (
                  <div 
                    key={idx}
                    className="grid grid-cols-3 gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{ramo.nome}</div>
                    <div className="text-right tabular-nums">{ramo.vigentes}</div>
                    <div className="text-right tabular-nums">{ramo.ativas}</div>
                  </div>
                ))}
              </div>

              {/* Footer with totals */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t font-bold">
                <div>Total:</div>
                <div className="text-right">{totals.vigentes}</div>
                <div className="text-right">{totals.ativas}</div>
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Clique em "Carregar Distribuição" para visualizar os dados
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
