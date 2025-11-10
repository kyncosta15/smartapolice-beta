import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Download, Users, FileText, Calendar, Loader2, User, MapPin, Info, Eye, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientesCorpNuvem, getProducao, getRenovacoes, getDocumento, getClienteAnexos } from '@/services/corpnuvem';
import { getClienteCompleto } from '@/services/corpnuvem/cliente-detalhado';
import { ClienteDetalhadoModal } from './ClienteDetalhadoModal';

export function CorpNuvemTabs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados Clientes
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [resultClientes, setResultClientes] = useState<any[]>([]);
  
  // Estados Produção
  const [loadingProducao, setLoadingProducao] = useState(false);
  const [resultProducao, setResultProducao] = useState<any>(null);
  const [dataInicio, setDataInicio] = useState('01/01/2025');
  const [dataFim, setDataFim] = useState('31/12/2025');
  
  // Estados Renovações
  const [loadingRenovacoes, setLoadingRenovacoes] = useState(false);
  const [resultRenovacoes, setResultRenovacoes] = useState<any>(null);
  
  // Estados Documentos
  const [loadingDocumento, setLoadingDocumento] = useState(false);
  const [resultDocumento, setResultDocumento] = useState<any>(null);
  const [codfil, setCodfil] = useState('1');
  const [nosnum, setNosnum] = useState('');
  
  // Estados Modal Cliente Detalhado
  const [modalClienteDetalhadoOpen, setModalClienteDetalhadoOpen] = useState(false);
  const [clienteDetalhadoDados, setClienteDetalhadoDados] = useState<any>(null);
  const [loadingClienteDetalhado, setLoadingClienteDetalhado] = useState(false);

  // Estados de Paginação
  const [pageClientes, setPageClientes] = useState(1);
  const [pageProducao, setPageProducao] = useState(1);
  const [pageRenovacoes, setPageRenovacoes] = useState(1);
  const [pageDocumentos, setPageDocumentos] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const handleBuscarClientes = async () => {
    if (!searchTerm) {
      toast({
        title: 'Atenção',
        description: 'Digite um nome, CPF ou código para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoadingClientes(true);
    try {
      const data = await getClientesCorpNuvem({ texto: searchTerm });
      
      // Garantir que sempre seja array
      const clientes = Array.isArray(data) ? data : [data];
      
      console.log('📊 [Busca Clientes] Resultado:', clientes);
      
      setResultClientes(clientes);
      setPageClientes(1);
      
      if (clientes.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: 'Nenhum cliente encontrado. Tente buscar por nome.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('❌ [Busca Clientes] Erro:', error);
      
      // Mensagem de erro mais amigável
      const errorMessage = error?.response?.data?.message || error.message;
      
      toast({
        title: 'Erro na busca',
        description: errorMessage?.includes('CPF') || errorMessage?.includes('CNPJ')
          ? 'Documento não encontrado. Tente buscar pelo nome do cliente.'
          : 'Erro ao buscar clientes. Tente novamente.',
        variant: 'destructive',
      });
      setResultClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleVerDetalhesCliente = async (cliente: any) => {
    setLoadingClienteDetalhado(true);
    setModalClienteDetalhadoOpen(true);
    setClienteDetalhadoDados(null);

    try {
      const codfil = cliente.codfil || 1;
      const codigo = cliente.codigo;

      console.log('🔍 [Cliente Detalhado] Buscando dados completos:', { codfil, codigo });

      const dadosCompletos = await getClienteCompleto(codfil, codigo);
      
      console.log('✅ [Cliente Detalhado] Dados carregados:', dadosCompletos);
      
      setClienteDetalhadoDados(dadosCompletos);
    } catch (error: any) {
      console.error('❌ [Cliente Detalhado] Erro:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações do cliente',
        variant: 'destructive',
      });
      setModalClienteDetalhadoOpen(false);
    } finally {
      setLoadingClienteDetalhado(false);
    }
  };

  const handleBuscarProducao = async () => {
    setLoadingProducao(true);
    try {
      const data = await getProducao({
        dt_ini: dataInicio,
        dt_fim: dataFim,
        texto: searchTerm
      });
      
      // Log para debug - ver estrutura dos dados
      if (data?.producao && data.producao.length > 0) {
        console.log('📋 [Produção] Estrutura do primeiro item:', data.producao[0]);
      }
      
      setResultProducao(data);
      setPageProducao(1); // Reset para primeira página
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao buscar produção',
        variant: 'destructive',
      });
    } finally {
      setLoadingProducao(false);
    }
  };

  const handleBuscarRenovacoes = async () => {
    setLoadingRenovacoes(true);
    try {
      const data = await getRenovacoes({
        dt_ini: dataInicio,
        dt_fim: dataFim,
        texto: searchTerm
      });
      setResultRenovacoes(data);
      setPageRenovacoes(1); // Reset para primeira página
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao buscar renovações',
        variant: 'destructive',
      });
    } finally {
      setLoadingRenovacoes(false);
    }
  };

  const handleBuscarDocumento = async () => {
    if (!nosnum) {
      toast({
        title: 'Atenção',
        description: 'Informe o número do documento',
        variant: 'destructive',
      });
      return;
    }
    
    setLoadingDocumento(true);
    try {
      const data = await getDocumento({
        codfil: Number(codfil),
        nosnum: Number(nosnum)
      });
      setResultDocumento(data);
      setPageDocumentos(1); // Reset para primeira página
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao buscar documento',
        variant: 'destructive',
      });
    } finally {
      setLoadingDocumento(false);
    }
  };

  const handleVisualizarAnexo = (anexo: any) => {
    if (anexo.url || anexo.arquivo_url) {
      window.open(anexo.url || anexo.arquivo_url, '_blank');
    } else {
      toast({
        title: 'Aviso',
        description: 'URL do documento não disponível',
        variant: 'destructive',
      });
    }
  };

  const handleBaixarAnexo = (anexo: any) => {
    if (anexo.url || anexo.arquivo_url) {
      const link = document.createElement('a');
      link.href = anexo.url || anexo.arquivo_url;
      link.download = anexo.nome || anexo.descricao || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: 'Aviso',
        description: 'URL do documento não disponível',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
        <CardTitle className="text-2xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          API CorpNuvem
        </CardTitle>
        <CardDescription className="text-base">
          Consultas e buscas na base de dados corporativa
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="clientes" className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-1 border border-border/40">
            <TabsList className="w-full justify-start bg-transparent border-none rounded-none h-auto p-0 gap-1">
              <TabsTrigger 
                value="clientes" 
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 px-4 py-3"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="font-medium">Clientes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="producao"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 px-4 py-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="font-medium">Produção</span>
              </TabsTrigger>
              <TabsTrigger 
                value="renovacoes"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 px-4 py-3"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Renovações</span>
              </TabsTrigger>
              <TabsTrigger 
                value="documentos"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 px-4 py-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="font-medium">Documentos</span>
              </TabsTrigger>
            </TabsList>
          </div>

            {/* Tab Clientes */}
            <TabsContent value="clientes" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Buscar Clientes
              </CardTitle>
              <CardDescription>
                Busque clientes por nome, CPF/CNPJ ou código
                {resultClientes.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultClientes.length} cliente{resultClientes.length !== 1 ? 's' : ''} encontrado{resultClientes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome, CPF/CNPJ ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarClientes()}
                  className="border-border/60 focus:border-primary transition-colors"
                />
                <Button onClick={handleBuscarClientes} disabled={loadingClientes} className="shadow-sm">
                  {loadingClientes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
                {(searchTerm || resultClientes.length > 0) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setResultClientes([]);
                      setPageClientes(1);
                    }}
                    className="shadow-sm"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {!loadingClientes && resultClientes.length === 0 && searchTerm && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                    <p className="text-sm text-muted-foreground">Tente buscar com outro termo</p>
                  </CardContent>
                </Card>
              )}

              {resultClientes.length > 0 && (
                <>
                  <div className="space-y-2 max-h-[500px] overflow-auto">
                    {resultClientes
                      .slice((pageClientes - 1) * ITEMS_PER_PAGE, pageClientes * ITEMS_PER_PAGE)
                      .map((cliente: any, idx: number) => (
                        <Card key={idx} className="border-border/40 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                          <CardContent className="p-5">
                             <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{cliente.nome}</h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {cliente.codigo && <p>Código: {cliente.codigo}</p>}
                                  {(cliente.cpf_cnpj || cliente.cpf || cliente.cnpj) && (
                                    <p>CPF/CNPJ: {cliente.cpf_cnpj || cliente.cpf || cliente.cnpj}</p>
                                  )}
                                  {cliente.telefone && <p>Tel: {cliente.telefone}</p>}
                                  {cliente.ddd && cliente.numero && <p>Tel: ({cliente.ddd}) {cliente.numero}</p>}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerDetalhesCliente(cliente)}
                                className="shrink-0"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {resultClientes.length > ITEMS_PER_PAGE && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPageClientes(p => Math.max(1, p - 1))}
                            className={pageClientes === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(resultClientes.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setPageClientes(page)}
                              isActive={pageClientes === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPageClientes(p => Math.min(Math.ceil(resultClientes.length / ITEMS_PER_PAGE), p + 1))}
                            className={pageClientes >= Math.ceil(resultClientes.length / ITEMS_PER_PAGE) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Produção */}
        <TabsContent value="producao" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Consultar Produção
              </CardTitle>
              <CardDescription>
                Busque produção por período
                {resultProducao?.producao && resultProducao.producao.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultProducao.producao.length} registro{resultProducao.producao.length !== 1 ? 's' : ''} encontrado{resultProducao.producao.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  type="text"
                  placeholder="Data Início (DD/MM/AAAA)"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="border-border/60 focus:border-primary transition-colors"
                />
                <Input
                  type="text"
                  placeholder="Data Fim (DD/MM/AAAA)"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="border-border/60 focus:border-primary transition-colors"
                />
                <Button onClick={handleBuscarProducao} disabled={loadingProducao} className="shadow-sm">
                  {loadingProducao ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>

              {!loadingProducao && resultProducao && resultProducao.producao && resultProducao.producao.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhuma produção encontrada</p>
                    <p className="text-sm text-muted-foreground">Tente buscar com outro período</p>
                  </CardContent>
                </Card>
              )}

              {resultProducao && resultProducao.producao && resultProducao.producao.length > 0 && (
                <>
                  <div className="space-y-2 max-h-[500px] overflow-auto">
                    {resultProducao.producao
                      .slice((pageProducao - 1) * ITEMS_PER_PAGE, pageProducao * ITEMS_PER_PAGE)
                      .map((prod: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="col-span-2">
                                <span className="font-medium">Cliente:</span>{' '}
                                <button
                                  onClick={() => {
                                    const codigoCliente = prod.codigo || prod.codigo_cliente || prod.codcli || prod.cod_cliente;
                                    console.log('🔍 Código do cliente encontrado:', codigoCliente, 'Objeto completo:', prod);
                                    if (codigoCliente) {
                                      handleVerDetalhesCliente({ codigo: codigoCliente });
                                    } else {
                                      toast({
                                        title: 'Aviso',
                                        description: 'Código do cliente não disponível',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                  className="text-primary hover:underline font-medium cursor-pointer"
                                >
                                  {prod.cliente}
                                </button>
                              </div>
                              {prod.numapo && (
                                <div>
                                  <span className="font-medium">Apólice:</span> {prod.numapo}
                                </div>
                              )}
                              {prod.numprop && (
                                <div>
                                  <span className="font-medium">Proposta:</span> {prod.numprop}
                                </div>
                              )}
                              {prod.ramo && (
                                <div>
                                  <span className="font-medium">Ramo:</span> {prod.ramo}
                                </div>
                              )}
                              {prod.seguradora && (
                                <div>
                                  <span className="font-medium">Seguradora:</span> {prod.seguradora}
                                </div>
                              )}
                              {prod.inivig && prod.fimvig && (
                                <div className="col-span-2">
                                  <span className="font-medium">Vigência:</span> {prod.inivig} a {prod.fimvig}
                                </div>
                              )}
                              {prod.preliq && (
                                <div>
                                  <span className="font-medium">Prêmio Líquido:</span> R$ {prod.preliq.toFixed(2)}
                                </div>
                              )}
                              {prod.pretot && (
                                <div>
                                  <span className="font-medium">Prêmio Total:</span> R$ {prod.pretot.toFixed(2)}
                                </div>
                              )}
                              {prod.tipdoc_txt && (
                                <div>
                                  <span className="font-medium">Tipo:</span> {prod.tipdoc_txt}
                                </div>
                              )}
                              {prod.cancelado && (
                                <div>
                                  <span className="font-medium">Cancelado:</span> {prod.cancelado === 'T' ? 'Sim' : 'Não'}
                                </div>
                              )}
                              {prod.sit_acompanhamento_txt && (
                                <div className="col-span-2">
                                  <span className="font-medium">Situação:</span> {prod.sit_acompanhamento_txt}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {resultProducao.producao.length > ITEMS_PER_PAGE && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPageProducao(p => Math.max(1, p - 1))}
                            className={pageProducao === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(resultProducao.producao.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setPageProducao(page)}
                              isActive={pageProducao === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPageProducao(p => Math.min(Math.ceil(resultProducao.producao.length / ITEMS_PER_PAGE), p + 1))}
                            className={pageProducao >= Math.ceil(resultProducao.producao.length / ITEMS_PER_PAGE) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Renovações */}
        <TabsContent value="renovacoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultar Renovações</CardTitle>
              <CardDescription>
                Busque renovações por período
                {resultRenovacoes?.renovacoes && resultRenovacoes.renovacoes.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultRenovacoes.renovacoes.length} renovaç{resultRenovacoes.renovacoes.length !== 1 ? 'ões' : 'ão'} encontrada{resultRenovacoes.renovacoes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  type="text"
                  placeholder="Data Início (DD/MM/AAAA)"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Data Fim (DD/MM/AAAA)"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
                <Button onClick={handleBuscarRenovacoes} disabled={loadingRenovacoes}>
                  {loadingRenovacoes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>

              {!loadingRenovacoes && resultRenovacoes && resultRenovacoes.renovacoes && resultRenovacoes.renovacoes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhuma renovação encontrada</p>
                    <p className="text-sm text-muted-foreground">Tente buscar com outro período</p>
                  </CardContent>
                </Card>
              )}

              {resultRenovacoes && resultRenovacoes.renovacoes && resultRenovacoes.renovacoes.length > 0 && (
                <>
                  <div className="space-y-2 max-h-[500px] overflow-auto">
                    {resultRenovacoes.renovacoes
                      .slice((pageRenovacoes - 1) * ITEMS_PER_PAGE, pageRenovacoes * ITEMS_PER_PAGE)
                      .map((ren: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-medium">Cliente:</span> {ren.cliente}</div>
                              <div><span className="font-medium">Apólice:</span> {ren.numapo}</div>
                              <div><span className="font-medium">Vigência:</span> {ren.inivig} a {ren.fimvig}</div>
                              <div><span className="font-medium">Valor:</span> R$ {ren.pretot?.toFixed(2)}</div>
                              <div><span className="font-medium">Seguradora:</span> {ren.seguradora}</div>
                              <div><span className="font-medium">Ramo:</span> {ren.ramo}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {resultRenovacoes.renovacoes.length > ITEMS_PER_PAGE && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPageRenovacoes(p => Math.max(1, p - 1))}
                            className={pageRenovacoes === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(resultRenovacoes.renovacoes.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setPageRenovacoes(page)}
                              isActive={pageRenovacoes === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPageRenovacoes(p => Math.min(Math.ceil(resultRenovacoes.renovacoes.length / ITEMS_PER_PAGE), p + 1))}
                            className={pageRenovacoes >= Math.ceil(resultRenovacoes.renovacoes.length / ITEMS_PER_PAGE) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Documento</CardTitle>
              <CardDescription>
                Consulte documento específico
                {resultDocumento?.documento && resultDocumento.documento.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultDocumento.documento.length} documento{resultDocumento.documento.length !== 1 ? 's' : ''} encontrado{resultDocumento.documento.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  type="number"
                  placeholder="Código Filial"
                  value={codfil}
                  onChange={(e) => setCodfil(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Número Documento"
                  value={nosnum}
                  onChange={(e) => setNosnum(e.target.value)}
                />
                <Button onClick={handleBuscarDocumento} disabled={loadingDocumento}>
                  {loadingDocumento ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>

              {!loadingDocumento && resultDocumento && resultDocumento.documento && resultDocumento.documento.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum documento encontrado</p>
                    <p className="text-sm text-muted-foreground">Verifique os dados informados</p>
                  </CardContent>
                </Card>
              )}

              {resultDocumento && resultDocumento.documento && resultDocumento.documento.length > 0 && (
                <>
                  <div className="space-y-4 max-h-[500px] overflow-auto">
                    {resultDocumento.documento
                      .slice((pageDocumentos - 1) * ITEMS_PER_PAGE, pageDocumentos * ITEMS_PER_PAGE)
                      .map((doc: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-semibold">Cliente:</span> {doc.cliente}
                              </div>
                              <div>
                                <span className="font-semibold">Apólice:</span> {doc.numapo}
                              </div>
                              <div>
                                <span className="font-semibold">Tipo:</span> {doc.tipdoc_txt}
                              </div>
                              <div>
                                <span className="font-semibold">Ramo:</span> {doc.ramo}
                              </div>
                              <div>
                                <span className="font-semibold">Seguradora:</span> {doc.seguradora}
                              </div>
                              <div>
                                <span className="font-semibold">Vigência:</span> {doc.inivig} a {doc.fimvig}
                              </div>
                              <div>
                                <span className="font-semibold">Prêmio Líquido:</span> R$ {doc.preliq?.toFixed(2)}
                              </div>
                              <div>
                                <span className="font-semibold">Prêmio Total:</span> R$ {doc.pretot?.toFixed(2)}
                              </div>
                              <div>
                                <span className="font-semibold">Forma Pagamento:</span> {doc.forma_pag}
                              </div>
                              <div>
                                <span className="font-semibold">Nº Parcelas:</span> {doc.numpar}
                              </div>
                              <div className="col-span-2">
                                <span className="font-semibold">Situação:</span> {doc.sit_acompanhamento_txt}
                              </div>
                            </div>
                            
                            {doc.parcelas && doc.parcelas.length > 0 && (
                              <div className="pt-3 border-t">
                                <h4 className="font-semibold mb-2">Parcelas</h4>
                                <div className="space-y-1 text-xs">
                                  {doc.parcelas.map((parc: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                      <span>Parcela {parc.parc} - Venc: {parc.datvenc}</span>
                                      <span className="font-medium">R$ {parc.vlvenc?.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  {resultDocumento.documento.length > ITEMS_PER_PAGE && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPageDocumentos(p => Math.max(1, p - 1))}
                            className={pageDocumentos === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(resultDocumento.documento.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setPageDocumentos(page)}
                              isActive={pageDocumentos === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPageDocumentos(p => Math.min(Math.ceil(resultDocumento.documento.length / ITEMS_PER_PAGE), p + 1))}
                            className={pageDocumentos >= Math.ceil(resultDocumento.documento.length / ITEMS_PER_PAGE) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </CardContent>
    </Card>

      {/* Modal Cliente Detalhado */}
      <ClienteDetalhadoModal
        open={modalClienteDetalhadoOpen}
        onOpenChange={setModalClienteDetalhadoOpen}
        dados={clienteDetalhadoDados}
        loading={loadingClienteDetalhado}
      />
    </>
  );
}
