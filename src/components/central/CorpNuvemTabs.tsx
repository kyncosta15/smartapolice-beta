import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, FileText, Calendar, Loader2 } from 'lucide-react';
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

  const handleBuscarClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await getClientesCorpNuvem(
        searchTerm ? { nome: searchTerm } : { codfil: 1 }
      );
      setResultClientes(data);
      
      toast({
        title: '✅ Clientes encontrados',
        description: `${data?.length || 0} cliente(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Erro ao buscar clientes',
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
                        <h4 className="font-semibold">{cliente.nome}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {cliente.cpf_cnpj && <p>CPF/CNPJ: {cliente.cpf_cnpj}</p>}
                          {cliente.email && <p>Email: {cliente.email}</p>}
                          {cliente.telefone && <p>Tel: {cliente.telefone}</p>}
                          {cliente.cidade && <p>Cidade: {cliente.cidade}</p>}
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
                <div className="bg-muted p-4 rounded-lg max-h-[500px] overflow-auto">
                  <pre className="text-xs">{JSON.stringify(resultDocumento, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
