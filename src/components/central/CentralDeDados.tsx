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
  getTelefonesPorCliente,
  getProdutores,
  getRamos,
  getSinistros,
  getDadosBI,
  getDadosInCorp
} from '@/services/rcorp';
import { CorpNuvemTabs } from './CorpNuvemTabs';
import { SegurosDistribution } from './SegurosDistribution';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CentralDeDados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('corpnuvem');
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

  // Estados para Produtores
  const [loadingProdutores, setLoadingProdutores] = useState(false);
  const [resultProdutores, setResultProdutores] = useState<any[]>([]);

  // Estados para Ramos
  const [loadingRamos, setLoadingRamos] = useState(false);
  const [resultRamos, setResultRamos] = useState<any[]>([]);

  // Estados para Sinistros
  const [loadingSinistros, setLoadingSinistros] = useState(false);
  const [resultSinistros, setResultSinistros] = useState<any[]>([]);

  // Estados para BI
  const [loadingBI, setLoadingBI] = useState(false);
  const [biAno, setBiAno] = useState('2023');
  const [biTipo, setBiTipo] = useState('producao');
  const [resultBI, setResultBI] = useState<any>(null);

  // Estados para InCorp
  const [loadingIncorp, setLoadingIncorp] = useState(false);
  const [empresaId, setEmpresaId] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [resultIncorp, setResultIncorp] = useState<any>(null);

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

  const handleBuscarProdutores = async () => {
    setLoadingProdutores(true);
    try {
      const data = await getProdutores({ nome: searchTerm });
      setResultProdutores(data);
      
      toast({
        title: '✅ Produtores encontrados',
        description: `${data?.length || 0} produtor(es) encontrado(s)`,
      });
    } catch (error) {
      console.error('Erro ao buscar produtores:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar os produtores.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProdutores(false);
    }
  };

  const handleListarRamos = async () => {
    setLoadingRamos(true);
    try {
      const data = await getRamos();
      setResultRamos(data);
      
      toast({
        title: '✅ Ramos carregados',
        description: `${data?.length || 0} ramo(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('Erro ao buscar ramos:', error);
      toast({
        title: 'Erro ao carregar ramos',
        description: 'Não foi possível carregar os ramos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRamos(false);
    }
  };

  const handleBuscarSinistros = async () => {
    setLoadingSinistros(true);
    try {
      const data = await getSinistros({ numeroApolice: searchTerm });
      setResultSinistros(data);
      
      toast({
        title: '✅ Sinistros encontrados',
        description: `${data?.length || 0} sinistro(s) encontrado(s)`,
      });
    } catch (error) {
      console.error('Erro ao buscar sinistros:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar os sinistros.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSinistros(false);
    }
  };

  const handleBuscarBI = async () => {
    setLoadingBI(true);
    try {
      const data = await getDadosBI({ 
        tipo: biTipo, 
        ano: Number(biAno) 
      });
      setResultBI(data);
      
      toast({
        title: '✅ Dados BI carregados',
        description: 'Indicadores obtidos com sucesso',
      });
    } catch (error) {
      console.error('Erro ao buscar dados BI:', error);
      toast({
        title: 'Erro ao carregar indicadores',
        description: 'Não foi possível carregar os dados de BI.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBI(false);
    }
  };

  const handleBuscarInCorp = async () => {
    setLoadingIncorp(true);
    try {
      const data = await getDadosInCorp({
        empresa_id: empresaId ? Number(empresaId) : undefined,
        grupo_id: grupoId ? Number(grupoId) : undefined
      });
      setResultIncorp(data);
      
      toast({
        title: '✅ Dados InCorp carregados',
        description: 'Dados corporativos obtidos com sucesso',
      });
    } catch (error) {
      console.error('Erro ao buscar dados InCorp:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do InCorp.',
        variant: 'destructive',
      });
    } finally {
      setLoadingIncorp(false);
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
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Nenhum negócio encontrado</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {resultNegocios.negocios.map((item: any) => (
          <Card key={item.id} className="border-border/40 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
            <CardContent className="p-5">
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
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Nenhum cliente encontrado</p>
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
            <Card key={cliente.id} className="overflow-hidden border-border/40 hover:shadow-lg transition-all duration-200">
              <Collapsible open={isExpanded}>
                <CardContent className="p-5">
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
    <div className="space-y-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            Central de Dados
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            Importação e gerenciamento de dados externos da RCORP
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 p-1.5 shadow-sm">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent gap-1">
            <TabsTrigger 
              value="corpnuvem"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-lg py-3"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium">Dados Corp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="negocios"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-lg py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium">Propostas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sinistros"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-lg py-3"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium">Ocorrências</span>
            </TabsTrigger>
            <TabsTrigger 
              value="seguros"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-lg py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium">Seguros</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bi"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-lg py-3"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium">Indicadores</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CorpNuvem Tab */}
        <TabsContent value="corpnuvem">
          <CorpNuvemTabs />
        </TabsContent>

        {/* Negócios Tab */}
        <TabsContent value="negocios" className="space-y-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Importar Negócios em Cálculo
              </CardTitle>
              <CardDescription>
                Busque e importe negócios da RCORP que estão em fase de cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ, protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-border/60 focus:border-primary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleImportNegocios()}
                    disabled={loadingNegocios}
                  />
                </div>
                <Button onClick={handleImportNegocios} disabled={loadingNegocios} className="shadow-sm">
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

        {/* Seguros Distribution Tab */}
        <TabsContent value="seguros" className="space-y-4">
          <SegurosDistribution />
        </TabsContent>

        {/* Sinistros Tab */}
        <TabsContent value="sinistros" className="space-y-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Buscar Sinistros
              </CardTitle>
              <CardDescription>
                Consulte sinistros por número da apólice, número do sinistro ou cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Número da apólice, sinistro ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-border/60 focus:border-primary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarSinistros()}
                    disabled={loadingSinistros}
                  />
                </div>
                <Button onClick={handleBuscarSinistros} disabled={loadingSinistros} className="shadow-sm">
                  {loadingSinistros ? (
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

              {loadingSinistros ? (
                renderSkeletons()
              ) : resultSinistros && resultSinistros.length > 0 ? (
                <div className="space-y-3">
                  {resultSinistros.map((sinistro: any, idx: number) => (
                    <Card key={idx} className="border-border/40 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Nº {sinistro.numeroSinistro}</Badge>
                              {sinistro.situacao && (
                                <Badge 
                                  variant={
                                    sinistro.situacao.toLowerCase().includes('aberto') ? 'destructive' :
                                    sinistro.situacao.toLowerCase().includes('fechado') ? 'default' :
                                    'secondary'
                                  }
                                >
                                  {sinistro.situacao}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-base mb-1">
                              Apólice: {sinistro.numeroApolice}
                            </h4>
                            {sinistro.cliente && (
                              <p className="text-sm text-muted-foreground">
                                Cliente: {sinistro.cliente}
                              </p>
                            )}
                            {sinistro.dataOcorrencia && (
                              <p className="text-sm text-muted-foreground">
                                Data: {sinistro.dataOcorrencia}
                              </p>
                            )}
                            {sinistro.valorIndenizado && (
                              <p className="text-sm font-medium text-primary mt-2">
                                Valor: R$ {parseFloat(sinistro.valorIndenizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
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
              ) : resultSinistros && resultSinistros.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum sinistro encontrado</p>
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BI Tab */}
        <TabsContent value="bi" className="space-y-4">
          {/* Produtores Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Buscar Produtores
              </CardTitle>
              <CardDescription>
                Consulte produtores cadastrados na RCORP por nome ou código
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código do produtor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-border/60 focus:border-primary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarProdutores()}
                    disabled={loadingProdutores}
                  />
                </div>
                <Button onClick={handleBuscarProdutores} disabled={loadingProdutores} className="shadow-sm">
                  {loadingProdutores ? (
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

              {loadingProdutores ? (
                renderSkeletons()
              ) : resultProdutores && resultProdutores.length > 0 ? (
                <div className="space-y-3">
                  {resultProdutores.map((produtor: any, idx: number) => (
                    <Card key={idx} className="border-border/40 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Código: {produtor.codigo}</Badge>
                              {produtor.ativo && (
                                <Badge variant="default">Ativo</Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-base">{produtor.nome}</h4>
                            {produtor.documento && (
                              <p className="text-sm text-muted-foreground mt-1">
                                CPF/CNPJ: {produtor.documento}
                              </p>
                            )}
                            {produtor.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {produtor.email}
                              </p>
                            )}
                            {produtor.telefone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {produtor.telefone}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : resultProdutores && resultProdutores.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum produtor encontrado</p>
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>

          {/* Visualizações BI */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Ramos de Seguro
              </CardTitle>
              <CardDescription>
                Liste todos os ramos de seguro disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Button 
                onClick={handleListarRamos} 
                disabled={loadingRamos}
                className="w-full sm:w-auto shadow-sm"
              >
                {loadingRamos ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Listar Ramos
                  </>
                )}
              </Button>

              {loadingRamos ? (
                renderSkeletons()
              ) : resultRamos && resultRamos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {resultRamos.map((ramo: any, idx: number) => (
                    <Card key={idx} className="border-border/40 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Código: {ramo.codigo}</Badge>
                          </div>
                          <h4 className="font-semibold text-sm">{ramo.nome}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : resultRamos && resultRamos.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum ramo encontrado</p>
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>

          {/* Dashboards e Gráficos */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Indicadores BI
              </CardTitle>
              <CardDescription>
                Consulte indicadores de produção, sinistros e outros dados consolidados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Ano (ex: 2023)"
                  value={biAno}
                  onChange={(e) => setBiAno(e.target.value)}
                  disabled={loadingBI}
                />
                <Input
                  placeholder="Tipo (producao, sinistros)"
                  value={biTipo}
                  onChange={(e) => setBiTipo(e.target.value)}
                  disabled={loadingBI}
                />
                <Button 
                  onClick={handleBuscarBI} 
                  disabled={loadingBI}
                  className="w-full shadow-sm"
                >
                  {loadingBI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {resultBI && (
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Resultado BI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto max-h-[400px] bg-background p-4 rounded-lg">
                      {JSON.stringify(resultBI, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {!resultBI && !loadingBI && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Configure ano e tipo, depois clique em Buscar
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Visualizações e Gráficos */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                InCorp - Dados Corporativos
              </CardTitle>
              <CardDescription>
                Consulte dados corporativos de empresas e grupos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="ID da Empresa"
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  disabled={loadingIncorp}
                  type="number"
                />
                <Input
                  placeholder="ID do Grupo"
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                  disabled={loadingIncorp}
                  type="number"
                />
                <Button 
                  onClick={handleBuscarInCorp} 
                  disabled={loadingIncorp}
                  className="w-full shadow-sm"
                >
                  {loadingIncorp ? (
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

              {resultIncorp && (
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Dados Corporativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto max-h-[400px] bg-background p-4 rounded-lg">
                      {JSON.stringify(resultIncorp, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {!resultIncorp && !loadingIncorp && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Informe ID da empresa ou grupo e clique em Buscar
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Dashboards e Gráficos */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-cyan-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-500" />
                Dashboards e Gráficos
              </CardTitle>
              <CardDescription>
                Visualizações avançadas em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Gráficos interativos em desenvolvimento</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Relatórios personalizados em desenvolvimento</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
