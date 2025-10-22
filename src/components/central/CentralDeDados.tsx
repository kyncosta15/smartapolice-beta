import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Users, FileText, AlertCircle, BarChart3, Loader2, MapPin, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  getClientes,
  getNegociosEmCalculo,
  getEnderecosPorCliente,
  getEmailsPorCliente,
  getTelefonesPorCliente
} from '@/services/rcorp';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CentralDeDados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('negocios');
  const { toast } = useToast();

  // Estados para Negócios
  const [loadingNegocios, setLoadingNegocios] = useState(false);
  const [resultNegocios, setResultNegocios] = useState<any>(null);

  // Estados para Clientes
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [resultClientes, setResultClientes] = useState<any[]>([]);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [detalhesCliente, setDetalhesCliente] = useState<Record<number, any>>({});
  const [loadingDetalhes, setLoadingDetalhes] = useState<number | null>(null);

  const handleImportNegocios = async () => {
    setLoadingNegocios(true);
    try {
      const data = await getNegociosEmCalculo({
        dtini: "01/01/2023",
        dtfim: "31/12/2025",
        texto: searchTerm,
        qtd_pag: 15,
        pag: 1,
        status: "TODOS"
      });
      
      setResultNegocios(data);
      
      toast({
        title: '✅ Negócios importados',
        description: `${data?.total || 0} negócio(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os negócios.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNegocios(false);
    }
  };

  const handleBuscarClientes = async () => {
    setLoadingClientes(true);
    setExpandedClientId(null);
    try {
      const data = await getClientes({ nome: searchTerm });
      setResultClientes(data);
      
      toast({
        title: '✅ Clientes encontrados',
        description: `${data?.length || 0} cliente(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar os clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleCarregarDetalhes = async (clienteId: number) => {
    // Se já está expandido, apenas colapsa
    if (expandedClientId === clienteId) {
      setExpandedClientId(null);
      return;
    }

    // Se já tem detalhes carregados, apenas expande
    if (detalhesCliente[clienteId]) {
      setExpandedClientId(clienteId);
      return;
    }

    // Carregar detalhes
    setLoadingDetalhes(clienteId);
    setExpandedClientId(clienteId);
    
    try {
      const [enderecos, emails, telefones] = await Promise.all([
        getEnderecosPorCliente({ cliente_id: clienteId }),
        getEmailsPorCliente({ cliente_id: clienteId }),
        getTelefonesPorCliente({ cliente_id: clienteId })
      ]);

      setDetalhesCliente(prev => ({
        ...prev,
        [clienteId]: { enderecos, emails, telefones }
      }));
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes do cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetalhes(null);
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

  const renderNegociosResults = () => {
    if (!resultNegocios) return null;

    if (!resultNegocios.negocios || resultNegocios.negocios.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum negócio encontrado</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {resultNegocios.negocios.map((item: any) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">{item.protocolo || item.id}</Badge>
                    {item.status && (
                      <Badge variant="secondary">{item.status}</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-base">{item.cliente || item.nome}</h4>
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
  };

  const renderClientesResults = () => {
    if (!resultClientes || resultClientes.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {resultClientes.map((cliente: any) => {
          const isExpanded = expandedClientId === cliente.id;
          const detalhes = detalhesCliente[cliente.id];
          const isLoadingThis = loadingDetalhes === cliente.id;

          return (
            <Card key={cliente.id} className="overflow-hidden">
              <Collapsible open={isExpanded}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">{cliente.nome}</h4>
                      {cliente.cnpj && (
                        <p className="text-sm text-muted-foreground">CNPJ: {cliente.cnpj}</p>
                      )}
                      {cliente.cpf && (
                        <p className="text-sm text-muted-foreground">CPF: {cliente.cpf}</p>
                      )}
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCarregarDetalhes(cliente.id)}
                        disabled={isLoadingThis}
                      >
                        {isLoadingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
                    {detalhes && (
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Endereços */}
                        <Card className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Endereços
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {detalhes.enderecos?.length > 0 ? (
                              detalhes.enderecos.map((end: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <p className="font-medium">{end.logradouro}, {end.numero}</p>
                                  <p className="text-muted-foreground">
                                    {end.bairro} - {end.cidade}/{end.uf}
                                  </p>
                                  <p className="text-muted-foreground">CEP: {end.cep}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhum endereço cadastrado</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* E-mails */}
                        <Card className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              E-mails
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {detalhes.emails?.length > 0 ? (
                              detalhes.emails.map((email: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <p className="font-medium break-all">{email.email}</p>
                                  {email.tipo && (
                                    <p className="text-muted-foreground">{email.tipo}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhum e-mail cadastrado</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Telefones */}
                        <Card className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Telefones
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {detalhes.telefones?.length > 0 ? (
                              detalhes.telefones.map((tel: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <p className="font-medium">{tel.telefone}</p>
                                  {tel.tipo && (
                                    <p className="text-muted-foreground">{tel.tipo}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhum telefone cadastrado</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleImportNegocios()}
                    disabled={loadingNegocios}
                  />
                </div>
                <Button onClick={handleImportNegocios} disabled={loadingNegocios}>
                  {loadingNegocios ? (
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

              {loadingNegocios ? renderSkeletons() : renderNegociosResults()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Clientes</CardTitle>
              <CardDescription>
                Busque e visualize dados de clientes cadastrados na RCORP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ, CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarClientes()}
                    disabled={loadingClientes}
                  />
                </div>
                <Button onClick={handleBuscarClientes} disabled={loadingClientes}>
                  {loadingClientes ? (
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

              {loadingClientes ? renderSkeletons() : renderClientesResults()}
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
            <CardContent>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Funcionalidade em desenvolvimento</p>
                </CardContent>
              </Card>
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
              <span className="text-muted-foreground">Negócios em cálculo ✅</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="default" className="w-20">Fase 2</Badge>
              <span className="text-muted-foreground">Clientes com detalhes expansíveis ✅</span>
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
