import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { corpClient } from '@/lib/corpClient';
import { getClienteLigacoes } from '@/services/corpnuvem';

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
  const { toast } = useToast();

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

      // 4. Buscar documentos de cada cliente (limitando para não sobrecarregar)
      const MAX_CLIENTES = Math.min(clientes.length, 100); // Limitar a 100 clientes
      console.log(`🔄 Buscando documentos de ${MAX_CLIENTES} clientes...`);

      const hoje = new Date();
      let processados = 0;

      for (let i = 0; i < MAX_CLIENTES; i++) {
        const cliente = clientes[i];
        try {
          const ligacoes = await getClienteLigacoes(cliente.codigo);
          
          if (ligacoes.documentos?.documentos) {
            ligacoes.documentos.documentos.forEach(doc => {
              const ramoAbrev = doc.ramo.toUpperCase();
              
              // Verificar se o ramo existe no mapa
              let ramoData = ramoClientesMap.get(ramoAbrev);
              
              // Se não existe, criar novo (para ramos não cadastrados)
              if (!ramoData) {
                const nomeRamo = abrevToNomeMap.get(ramoAbrev) || ramoAbrev;
                ramoData = {
                  nome: nomeRamo,
                  clientesVigentes: new Set(),
                  clientesAtivas: new Set(),
                };
                ramoClientesMap.set(ramoAbrev, ramoData);
              }

              // Verificar se é vigente (fimvig >= hoje)
              const fimVigencia = doc.fimvig;
              if (fimVigencia) {
                try {
                  // Converter formato DD/MM/YYYY para Date
                  const [dia, mes, ano] = fimVigencia.split('/');
                  const dataFim = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                  
                  if (dataFim >= hoje) {
                    ramoData.clientesVigentes.add(cliente.codigo);
                  }
                } catch (e) {
                  console.warn('Erro ao parsear data:', fimVigencia);
                }
              }

              // Verificar se é ativa (não cancelada)
              if (doc.cancelado === 'F') {
                ramoData.clientesAtivas.add(cliente.codigo);
              }
            });
          }
          
          processados++;
          if (processados % 10 === 0) {
            console.log(`📊 Processados ${processados}/${MAX_CLIENTES} clientes...`);
          }
        } catch (error) {
          console.error(`Erro ao buscar ligações do cliente ${cliente.codigo}:`, error);
          // Continuar com próximo cliente
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
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribuição de Clientes por Tipo de Seguro
          </CardTitle>
          <CardDescription>
            Quantidade de clientes com apólices vigentes e ativas por ramo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleLoadData} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Carregar Distribuição
              </>
            )}
          </Button>

          {loading ? (
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
