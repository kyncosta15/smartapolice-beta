import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Search, Users, FileText, Calendar, Loader2, User, MapPin, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientesCorpNuvem, getProducao, getRenovacoes, getDocumento } from '@/services/corpnuvem';

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
      
      toast({
        title: '✅ Clientes encontrados',
        description: `${data?.length || 0} cliente(s)`,
      });
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
      setResultProducao(data);
      
      toast({
        title: '✅ Produção encontrada',
        description: `${data?.producao?.length || 0} registro(s)`,
      });
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
      
      toast({
        title: '✅ Renovações encontradas',
        description: `${data?.renovacoes?.length || 0} registro(s)`,
      });
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
      
      toast({
        title: '✅ Documento encontrado',
      });
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
    
    try {
      // Busca detalhes completos do cliente usando codfil e codigo
      const data = await getClientesCorpNuvem({ 
        codfil: 1, // Usar codfil padrão ou do cliente
        codigo: cliente.codigo 
      });
      
      if (data && data.length > 0) {
        setClienteSelecionado(data[0]);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API CorpNuvem</h2>
        <p className="text-muted-foreground">
          Consultas e buscas na API CorpNuvem
        </p>
      </div>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clientes">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="producao">
            <FileText className="h-4 w-4 mr-2" />
            Produção
          </TabsTrigger>
          <TabsTrigger value="renovacoes">
            <Calendar className="h-4 w-4 mr-2" />
            Renovações
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Clientes</CardTitle>
              <CardDescription>Consulte clientes cadastrados</CardDescription>
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

              {resultClientes.length > 0 && (
                <div className="space-y-2 max-h-[500px] overflow-auto">
                  {resultClientes.map((cliente: any, idx: number) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Produção */}
        <TabsContent value="producao">
          <Card>
            <CardHeader>
              <CardTitle>Consultar Produção</CardTitle>
              <CardDescription>Busque produção por período</CardDescription>
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

              {resultProducao && (
                <div className="bg-muted p-4 rounded-lg max-h-[500px] overflow-auto">
                  <pre className="text-xs">{JSON.stringify(resultProducao, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Renovações */}
        <TabsContent value="renovacoes">
          <Card>
            <CardHeader>
              <CardTitle>Consultar Renovações</CardTitle>
              <CardDescription>Busque renovações por período</CardDescription>
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

              {resultRenovacoes && (
                <div className="space-y-2 max-h-[500px] overflow-auto">
                  {resultRenovacoes.renovacoes?.map((ren: any, idx: number) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Documento</CardTitle>
              <CardDescription>Consulte documento específico</CardDescription>
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

              {resultDocumento && (
                <div className="space-y-4 max-h-[500px] overflow-auto">
                  {resultDocumento.documento?.map((doc: any, idx: number) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{clienteSelecionado.nome}</p>
                  </div>
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
                  {clienteSelecionado.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{clienteSelecionado.email}</p>
                    </div>
                  )}
                  {(clienteSelecionado.ddd || clienteSelecionado.numero) && (
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p className="font-medium">({clienteSelecionado.ddd}) {clienteSelecionado.numero}</p>
                    </div>
                  )}
                  {clienteSelecionado.celular && (
                    <div>
                      <span className="text-muted-foreground">Celular:</span>
                      <p className="font-medium">{clienteSelecionado.celular}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              {(clienteSelecionado.endereco || clienteSelecionado.bairro || clienteSelecionado.cidade || clienteSelecionado.uf || clienteSelecionado.cep) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Endereço</h3>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {clienteSelecionado.endereco && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Logradouro:</span>
                        <p className="font-medium">{clienteSelecionado.endereco}</p>
                      </div>
                    )}
                    {clienteSelecionado.bairro && (
                      <div>
                        <span className="text-muted-foreground">Bairro:</span>
                        <p className="font-medium">{clienteSelecionado.bairro}</p>
                      </div>
                    )}
                    {clienteSelecionado.cidade && (
                      <div>
                        <span className="text-muted-foreground">Cidade:</span>
                        <p className="font-medium">{clienteSelecionado.cidade}</p>
                      </div>
                    )}
                    {clienteSelecionado.uf && (
                      <div>
                        <span className="text-muted-foreground">UF:</span>
                        <p className="font-medium">{clienteSelecionado.uf}</p>
                      </div>
                    )}
                    {clienteSelecionado.cep && (
                      <div>
                        <span className="text-muted-foreground">CEP:</span>
                        <p className="font-medium">{clienteSelecionado.cep}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              {(clienteSelecionado.tipo || clienteSelecionado.situacao) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Informações Adicionais</h3>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {clienteSelecionado.tipo && (
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="font-medium">{clienteSelecionado.tipo}</p>
                      </div>
                    )}
                    {clienteSelecionado.situacao && (
                      <div>
                        <span className="text-muted-foreground">Situação:</span>
                        <p className="font-medium">{clienteSelecionado.situacao}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documentos - Seção preparada para futura implementação */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Documentos</h3>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum documento disponível
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
