import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Users, FileText, Calendar, Loader2, User, MapPin, Info, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientesCorpNuvem, getProducao, getRenovacoes, getDocumento, getClienteAnexos } from '@/services/corpnuvem';

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
  
  // Estados Modal Cliente
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [loadingClienteDetalhes, setLoadingClienteDetalhes] = useState(false);
  const [clienteAnexos, setClienteAnexos] = useState<any[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);

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
        description: 'Digite um nome para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoadingClientes(true);
    try {
      const data = await getClientesCorpNuvem({ texto: searchTerm });
      setResultClientes(data);
      setPageClientes(1); // Reset para primeira página
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || error.message || 'Erro ao buscar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoadingClientes(false);
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

  const handleVerDetalhesCliente = async (cliente: any) => {
    setModalClienteOpen(true);
    setLoadingClienteDetalhes(true);
    setClienteSelecionado(null);
    setClienteAnexos([]);
    
    try {
      // Busca detalhes completos do cliente usando codfil e codigo
      const data = await getClientesCorpNuvem({ 
        codfil: 1,
        codigo: cliente.codigo 
      });
      
      if (data && data.cliente && data.cliente.length > 0) {
        const clienteCompleto = data.cliente[0];
        console.log('📋 [Modal Cliente] Dados completos:', clienteCompleto);
        setClienteSelecionado(clienteCompleto);
        
        // Buscar anexos do cliente
        await handleBuscarAnexosCliente(cliente.codigo);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar detalhes do cliente',
        variant: 'destructive',
      });
      setModalClienteOpen(false);
    } finally {
      setLoadingClienteDetalhes(false);
    }
  };

  const handleBuscarAnexosCliente = async (codigoCliente: number) => {
    setLoadingAnexos(true);
    try {
      const data = await getClienteAnexos({
        codfil: 1,
        codigo: codigoCliente
      });
      
      if (data && data.anexos) {
        setClienteAnexos(data.anexos);
      }
    } catch (error: any) {
      console.error('Erro ao buscar anexos:', error);
      // Não exibir erro para o usuário, apenas registrar no console
      setClienteAnexos([]);
    } finally {
      setLoadingAnexos(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">API CorpNuvem</CardTitle>
        <CardDescription>
          Consultas e buscas na base de dados corporativa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-1">
            <TabsTrigger 
              value="clientes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger 
              value="producao"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Produção
            </TabsTrigger>
            <TabsTrigger 
              value="renovacoes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Renovações
            </TabsTrigger>
            <TabsTrigger 
              value="documentos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

            {/* Tab Clientes */}
            <TabsContent value="clientes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Clientes</CardTitle>
              <CardDescription>
                Consulte clientes cadastrados
                {resultClientes.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultClientes.length} cliente{resultClientes.length !== 1 ? 's' : ''} encontrado{resultClientes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarClientes()}
                />
                <Button onClick={handleBuscarClientes} disabled={loadingClientes}>
                  {loadingClientes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
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
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{cliente.nome}</h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {cliente.codigo && <p>Código: {cliente.codigo}</p>}
                                  {cliente.ddd && cliente.numero && <p>Tel: ({cliente.ddd}) {cliente.numero}</p>}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleVerDetalhesCliente(cliente)}
                                className="shrink-0"
                              >
                                <Search className="h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle>Consultar Produção</CardTitle>
              <CardDescription>
                Busque produção por período
                {resultProducao?.producao && resultProducao.producao.length > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    • {resultProducao.producao.length} registro{resultProducao.producao.length !== 1 ? 's' : ''} encontrado{resultProducao.producao.length !== 1 ? 's' : ''}
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
                <Button onClick={handleBuscarProducao} disabled={loadingProducao}>
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

      {/* Modal Detalhes do Cliente */}
      <Dialog open={modalClienteOpen} onOpenChange={setModalClienteOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>
          
          {loadingClienteDetalhes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : clienteSelecionado ? (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Dados Pessoais</h3>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {clienteSelecionado.nome && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{clienteSelecionado.nome}</p>
                    </div>
                  )}
                  {clienteSelecionado.codigo && (
                    <div>
                      <span className="text-muted-foreground">Código:</span>
                      <p className="font-medium">{clienteSelecionado.codigo}</p>
                    </div>
                  )}
                  {clienteSelecionado.cpf_cnpj && (
                    <div>
                      <span className="text-muted-foreground">CPF/CNPJ:</span>
                      <p className="font-medium">{clienteSelecionado.cpf_cnpj}</p>
                    </div>
                  )}
                  {clienteSelecionado.datanas && (
                    <div>
                      <span className="text-muted-foreground">Data Nascimento:</span>
                      <p className="font-medium">{clienteSelecionado.datanas}</p>
                    </div>
                  )}
                  {clienteSelecionado.sexo && (
                    <div>
                      <span className="text-muted-foreground">Sexo:</span>
                      <p className="font-medium">{clienteSelecionado.sexo === 'M' ? 'Masculino' : clienteSelecionado.sexo === 'F' ? 'Feminino' : clienteSelecionado.sexo}</p>
                    </div>
                  )}
                  {clienteSelecionado.estado_civil && (
                    <div>
                      <span className="text-muted-foreground">Estado Civil:</span>
                      <p className="font-medium">{clienteSelecionado.estado_civil}</p>
                    </div>
                  )}
                  {clienteSelecionado.profissao && (
                    <div>
                      <span className="text-muted-foreground">Profissão:</span>
                      <p className="font-medium">{clienteSelecionado.profissao}</p>
                    </div>
                  )}
                  {clienteSelecionado.escolaridade && (
                    <div>
                      <span className="text-muted-foreground">Escolaridade:</span>
                      <p className="font-medium">{clienteSelecionado.escolaridade}</p>
                    </div>
                  )}
                  {clienteSelecionado.ativo && (
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">{clienteSelecionado.ativo === 'T' ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contatos */}
              {((clienteSelecionado.emails && clienteSelecionado.emails.length > 0) || 
                (clienteSelecionado.telefones && clienteSelecionado.telefones.length > 0)) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Contatos</h3>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    {clienteSelecionado.emails && clienteSelecionado.emails.length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm">Emails:</span>
                        <div className="mt-1 space-y-1">
                          {clienteSelecionado.emails.map((emailObj: any, idx: number) => (
                            <p key={idx} className="font-medium text-sm">
                              {emailObj.email} {emailObj.padrao === 'T' && <span className="text-xs text-primary">(Principal)</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {clienteSelecionado.telefones && clienteSelecionado.telefones.length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm">Telefones:</span>
                        <div className="mt-1 space-y-1">
                          {clienteSelecionado.telefones.map((telObj: any, idx: number) => (
                            <p key={idx} className="font-medium text-sm">
                              ({telObj.ddd}) {telObj.numero}
                              {telObj.tipo && <span className="text-xs text-muted-foreground"> - {telObj.tipo === 'R' ? 'Residencial' : telObj.tipo === 'C' ? 'Comercial' : telObj.tipo}</span>}
                              {telObj.padrao === 'T' && <span className="text-xs text-primary"> (Principal)</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Endereço */}
              {clienteSelecionado.enderecos && clienteSelecionado.enderecos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Endereço</h3>
                  </div>
                  <Separator />
                  {clienteSelecionado.enderecos.map((end: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-2 gap-4 text-sm">
                      {end.logradouro && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Logradouro:</span>
                          <p className="font-medium">
                            {end.logradouro}
                            {end.numero ? `, ${end.numero}` : ''}
                          </p>
                        </div>
                      )}
                      {end.complemento && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Complemento:</span>
                          <p className="font-medium">{end.complemento}</p>
                        </div>
                      )}
                      {end.bairro && (
                        <div>
                          <span className="text-muted-foreground">Bairro:</span>
                          <p className="font-medium">{end.bairro}</p>
                        </div>
                      )}
                      {end.cidade && (
                        <div>
                          <span className="text-muted-foreground">Cidade:</span>
                          <p className="font-medium">{end.cidade} - {end.estado}</p>
                        </div>
                      )}
                      {end.cep && (
                        <div>
                          <span className="text-muted-foreground">CEP:</span>
                          <p className="font-medium">{end.cep}</p>
                        </div>
                      )}
                      {end.tipo && (
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">{end.tipo === 'R' ? 'Residencial' : end.tipo === 'C' ? 'Comercial' : end.tipo}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Observações */}
              {clienteSelecionado.observacoes && clienteSelecionado.observacoes.trim() && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Observações</h3>
                  </div>
                  <Separator />
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                    {clienteSelecionado.observacoes}
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Documentos</h3>
                </div>
                <Separator />
                {loadingAnexos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clienteAnexos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {clienteAnexos.map((anexo: any, idx: number) => (
                      <Card key={idx} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-primary" />
                          <p className="text-xs font-medium text-center line-clamp-2">
                            {anexo.nome || anexo.descricao || `Documento ${idx + 1}`}
                          </p>
                          {anexo.data && (
                            <p className="text-xs text-muted-foreground">
                              {anexo.data}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleVisualizarAnexo(anexo)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleBaixarAnexo(anexo)}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum documento disponível
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
