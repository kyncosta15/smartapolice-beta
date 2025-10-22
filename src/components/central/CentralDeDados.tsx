import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Users, FileText, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CentralDeDados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('negocios');
  const { toast } = useToast();

  const handleImport = async (tipo: string) => {
    setLoading(true);
    setData(null);
    
    try {
      // Simular delay de requisição
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implementar chamada real baseada no tipo
      // const response = await importarDados(tipo, searchTerm);
      
      // Mock data baseado no tipo
      const mockData = {
        negocios: {
          total: 3,
          items: [
            { id: 1, protocolo: 'RC-2025-001', cliente: 'Empresa ABC Ltda', cnpj: '12.345.678/0001-90', status: 'em_calculo' },
            { id: 2, protocolo: 'RC-2025-002', cliente: 'Indústria XYZ S.A.', cnpj: '98.765.432/0001-10', status: 'em_calculo' },
            { id: 3, protocolo: 'RC-2025-003', cliente: 'Comércio QWE ME', cnpj: '11.222.333/0001-44', status: 'em_calculo' },
          ]
        },
        clientes: {
          total: 0,
          items: [],
          message: 'Funcionalidade em desenvolvimento'
        },
        sinistros: {
          total: 0,
          items: [],
          message: 'Funcionalidade em desenvolvimento'
        },
        bi: {
          total: 0,
          items: [],
          message: 'Funcionalidade em desenvolvimento'
        }
      };
      
      setData(mockData[tipo as keyof typeof mockData]);
      
      toast({
        title: '✅ Dados importados',
        description: `${mockData[tipo as keyof typeof mockData].total || 0} registro(s) encontrado(s)`,
      });
      
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[300px]" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  const renderResults = () => {
    if (!data) return null;

    if (data.message) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{data.message}</p>
          </CardContent>
        </Card>
      );
    }

    if (data.items && data.items.length > 0) {
      return (
        <div className="space-y-3">
          {data.items.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{item.protocolo}</Badge>
                      {item.status && (
                        <Badge variant="secondary">{item.status}</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-base">{item.cliente}</h4>
                    {item.cnpj && (
                      <p className="text-sm text-muted-foreground">CNPJ: {item.cnpj}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum resultado encontrado
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Importação e gerenciamento de dados externos da RCORP
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="negocios" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Negócios</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="sinistros" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sinistros</span>
          </TabsTrigger>
          <TabsTrigger value="bi" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">BI</span>
          </TabsTrigger>
        </TabsList>

        {/* Negócios Tab */}
        <TabsContent value="negocios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Negócios em Cálculo</CardTitle>
              <CardDescription>
                Busque e importe negócios da RCORP que estão em fase de cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ, protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleImport('negocios')}
                    disabled={loading}
                  />
                </div>
                <Button onClick={() => handleImport('negocios')} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </div>

              {loading ? renderSkeletons() : renderResults()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Clientes</CardTitle>
              <CardDescription>
                Busque e visualize dados de clientes cadastrados na RCORP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                <Button onClick={() => handleImport('clientes')} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {loading ? renderSkeletons() : renderResults()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sinistros Tab */}
        <TabsContent value="sinistros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Sinistros</CardTitle>
              <CardDescription>
                Visualize sinistros relacionados aos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por protocolo, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                <Button onClick={() => handleImport('sinistros')} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {loading ? renderSkeletons() : renderResults()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BI Tab */}
        <TabsContent value="bi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualizações e BI</CardTitle>
              <CardDescription>
                Gráficos e dashboards com dados consolidados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Gráficos em desenvolvimento</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Produtores em desenvolvimento</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Roadmap de Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="default" className="w-20">Fase 1</Badge>
              <span className="text-muted-foreground">Negócios em cálculo (em desenvolvimento)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-20">Fase 2</Badge>
              <span className="text-muted-foreground">Clientes com busca e preview</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-20">Fase 3</Badge>
              <span className="text-muted-foreground">Sinistros relacionados</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="w-20">Fase 4</Badge>
              <span className="text-muted-foreground">Visualizações BI e produtores</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
