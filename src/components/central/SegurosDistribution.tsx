import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { corpClient } from '@/lib/corpClient';

interface Ramo {
  codigo: number;
  nome: string;
  abreviatura: string;
}

interface RamoCount {
  nome: string;
  vigentes: number;
  ativas: number;
  total: number;
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
          description: 'Nenhum ramo encontrado. Continuando com dados locais...',
        });
      }

      // 2. Buscar todas as apólices locais (tanto de policies quanto apolices_beneficios)
      console.log('🔄 Buscando apólices locais...');
      
      const [policiesResponse, beneficiosResponse] = await Promise.all([
        supabase
          .from('policies')
          .select('tipo_seguro, status, fim_vigencia, expiration_date'),
        supabase
          .from('apolices_beneficios')
          .select('tipo_beneficio, status, fim_vigencia')
      ]);

      if (policiesResponse.error) {
        console.error('❌ Erro ao buscar policies:', policiesResponse.error);
      }
      if (beneficiosResponse.error) {
        console.error('❌ Erro ao buscar apolices_beneficios:', beneficiosResponse.error);
      }

      const policies = policiesResponse.data || [];
      const beneficios = beneficiosResponse.data || [];

      console.log(`📊 Apólices encontradas: ${policies.length} policies + ${beneficios.length} benefícios`);

      // Se não há dados locais nem ramos, retornar
      if (policies.length === 0 && beneficios.length === 0) {
        toast({
          title: 'Sem dados',
          description: 'Nenhuma apólice encontrada no sistema.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // 3. Criar mapeamento de tipos locais para ramos da API
      const tipoToRamoMap: Record<string, string> = {
        'auto': 'AUTOMOVEL',
        'automovel': 'AUTOMOVEL',
        'acidentes_pessoais': 'ACIDENTES PESSOAIS',
        'residencial': 'RESIDENCIAL',
        'empresarial': 'EMPRESARIAL',
        'vida': 'VIDA INDIVIDUAL',
        'vida_individual': 'VIDA INDIVIDUAL',
        'vida_grupo': 'VIDA GRUPO',
        'saude': 'PLANO DE SAÚDE',
        'plano_saude': 'PLANO DE SAÚDE',
        'dental': 'DENTAL',
        'odonto': 'PLANO ODONTOLOGICO',
        'viagem': 'VIAGEM',
        'pet': 'SEGURO PET',
        'condominio': 'CONDOMINIO',
        'fianca': 'FIANCA LOCATICIA',
        'rc_profissional': 'RC PROFISSIONAL',
        'imobiliario': 'IMOBILIARIO',
        'bike': 'BIKE',
        'equipamentos': 'EQUIPAMENTOS',
        'transporte': 'TRANSP NACIONAL',
        'agricola': 'AGRÍCOLA',
        'nautico': 'NÁUTICO',
      };

      // 4. Criar mapa de contagem por ramo
      const ramoCountMap = new Map<string, RamoCount>();

      // Inicializar contadores com os ramos da API
      if (ramos.length > 0) {
        ramos.forEach(ramo => {
          ramoCountMap.set(ramo.nome.toUpperCase(), {
            nome: ramo.nome,
            vigentes: 0,
            ativas: 0,
            total: 0
          });
        });
      }

      // Helper para verificar se está vigente
      const isVigente = (fimVigencia: string | null, expirationDate: string | null) => {
        const dataFim = fimVigencia || expirationDate;
        if (!dataFim) return false;
        const vencimento = new Date(dataFim);
        const hoje = new Date();
        return vencimento >= hoje;
      };

      // Helper para mapear tipo local para ramo da API
      const mapTipoToRamo = (tipoLocal: string): string => {
        const tipoLower = tipoLocal.toLowerCase().trim();
        
        // Tentar mapeamento direto
        if (tipoToRamoMap[tipoLower]) {
          return tipoToRamoMap[tipoLower];
        }
        
        // Buscar por similaridade nos ramos da API
        for (const ramo of ramos) {
          const ramoNome = ramo.nome.toUpperCase();
          const tipoUpper = tipoLocal.toUpperCase();
          
          // Se o tipo contém parte do nome do ramo ou vice-versa
          if (ramoNome.includes(tipoUpper) || tipoUpper.includes(ramoNome)) {
            return ramo.nome;
          }
        }
        
        // Se não encontrou, retornar o tipo original em maiúsculas
        return tipoLocal.toUpperCase();
      };

      // Helper para encontrar ou criar ramo
      const getOrCreateRamo = (tipoLocal: string): RamoCount => {
        const ramoNome = mapTipoToRamo(tipoLocal);
        const nomeUpper = ramoNome.toUpperCase();
        
        if (!ramoCountMap.has(nomeUpper)) {
          ramoCountMap.set(nomeUpper, {
            nome: ramoNome,
            vigentes: 0,
            ativas: 0,
            total: 0
          });
        }
        return ramoCountMap.get(nomeUpper)!;
      };

      // Contar policies
      policies.forEach((policy: any) => {
        const tipo = (policy.tipo_seguro || 'OUTROS').trim();
        if (!tipo) return;

        const vigente = isVigente(policy.fim_vigencia, policy.expiration_date);
        const ativa = policy.status === 'ativa' || policy.status === 'vigente';

        const count = getOrCreateRamo(tipo);
        count.total++;
        if (vigente) count.vigentes++;
        if (ativa) count.ativas++;
      });

      // Contar benefícios
      beneficios.forEach((beneficio: any) => {
        const tipo = (beneficio.tipo_beneficio || 'OUTROS').trim();
        if (!tipo) return;

        const vigente = isVigente(beneficio.fim_vigencia, null);
        const ativa = beneficio.status === 'ativa' || beneficio.status === 'vigente';

        const count = getOrCreateRamo(tipo);
        count.total++;
        if (vigente) count.vigentes++;
        if (ativa) count.ativas++;
      });

      // Converter para array e ordenar por total
      const ramosArray = Array.from(ramoCountMap.values())
        .filter(r => r.total > 0) // Mostrar apenas ramos com apólices
        .sort((a, b) => b.total - a.total);

      setRamosData(ramosArray);

      toast({
        title: 'Dados carregados',
        description: `${ramosArray.length} tipos de seguro com apólices encontrados`,
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
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4" />
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
      total: acc.total + ramo.total,
    }),
    { vigentes: 0, ativas: 0, total: 0 }
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribuição de Seguros por Tipo
          </CardTitle>
          <CardDescription>
            Visualize a quantidade de apólices vigentes e ativas por tipo de seguro
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
              <div className="grid grid-cols-4 gap-4 pb-2 border-b font-semibold text-sm">
                <div>Ramo</div>
                <div className="text-right">Vigentes</div>
                <div className="text-right">Ativas</div>
                <div className="text-right">Total</div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2">
                {ramosData.map((ramo, idx) => (
                  <div 
                    key={idx}
                    className="grid grid-cols-4 gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{ramo.nome}</div>
                    <div className="text-right tabular-nums">{ramo.vigentes}</div>
                    <div className="text-right tabular-nums">{ramo.ativas}</div>
                    <div className="text-right tabular-nums font-semibold">{ramo.total}</div>
                  </div>
                ))}
              </div>

              {/* Footer with totals */}
              <div className="grid grid-cols-4 gap-4 pt-2 border-t font-bold">
                <div>Total:</div>
                <div className="text-right">{totals.vigentes}</div>
                <div className="text-right">{totals.ativas}</div>
                <div className="text-right">{totals.total}</div>
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
