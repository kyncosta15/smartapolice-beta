import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Plus,
  FileText,
  Settings,
  LogOut,
  Calendar,
  Clock,
  Heart,
  Shield,
  UserCheck,
  Building2,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { useSyncDashboard } from '@/hooks/useSyncDashboard';

export const SmartBeneficiosDashboardMain = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { metrics, colaboradores, dependentes, empresas, tickets, apolices, colaboradorLinks, submissoes, isLoading, error, loadData } = useSmartBeneficiosData();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { syncDashboardData, forceRefresh, isSyncing } = useSyncDashboard();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Dados filtrados por busca
  const filteredColaboradores = colaboradores.filter(col =>
    col.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.cpf.includes(searchTerm)
  );

  const filteredDependentes = dependentes.filter(dep =>
    dep.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.cpf.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              SmartBenefícios Dashboard
            </h1>
            <p className="text-muted-foreground">
              Gestão inteligente de benefícios corporativos
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              disabled={isLoading || isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isSyncing ? 'animate-spin' : ''}`} />
              {isLoading || isSyncing ? 'Atualizando...' : 'Atualizar'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile?.full_name || user?.email || 'Usuário'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Vidas Ativas
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {metrics.vidasAtivas}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Custo Mensal
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(metrics.custoMensal)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Custo Médio/Vida
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(metrics.custoMedioVida)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tickets Abertos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {metrics.ticketsAbertos}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="colaboradores">
              Colaboradores ({metrics.colaboradoresAtivos})
            </TabsTrigger>
            <TabsTrigger value="dependentes">
              Dependentes ({metrics.dependentesAtivos})
            </TabsTrigger>
            <TabsTrigger value="apolices">Apólices</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resumo por Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Empresas Cadastradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {empresas.slice(0, 5).map((empresa) => (
                      <div key={empresa.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{empresa.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {empresa.cnpj}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {colaboradores.filter(col => col.empresa_id === empresa.id).length} colaboradores
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tickets Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Solicitações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submissoes.slice(0, 5).map((submissao) => (
                      <div key={submissao.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Protocolo: {submissao.numero_protocolo || 'Pendente'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(submissao.created_at)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            submissao.status === 'recebida' ? 'default' :
                            submissao.status === 'processada' ? 'secondary' : 'destructive'
                          }
                        >
                          {submissao.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Colaborador
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredColaboradores.map((colaborador) => (
                <Card key={colaborador.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(colaborador.nome)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{colaborador.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            CPF: {colaborador.cpf}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cargo: {colaborador.cargo || 'Não informado'}
                          </p>
                          {colaborador.custo_mensal && (
                            <p className="text-sm font-medium text-primary">
                              Custo Mensal: {formatCurrency(colaborador.custo_mensal)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={colaborador.status === 'ativo' ? 'default' : 'secondary'}
                      >
                        {colaborador.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Dependentes Tab */}
          <TabsContent value="dependentes" className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dependente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredDependentes.map((dependente) => (
                <Card key={dependente.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(dependente.nome)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{dependente.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            CPF: {dependente.cpf}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Parentesco: {dependente.grau_parentesco}
                          </p>
                          {dependente.custo_mensal && (
                            <p className="text-sm font-medium text-primary">
                              Custo Mensal: {formatCurrency(dependente.custo_mensal)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={dependente.status === 'ativo' ? 'default' : 'secondary'}
                      >
                        {dependente.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Apólices Tab */}
          <TabsContent value="apolices" className="space-y-6">
            <div className="grid gap-4">
              {apolices.map((apolice) => (
                <Card key={apolice.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{apolice.tipo_beneficio}</h3>
                        <p className="text-sm text-muted-foreground">
                          Seguradora: {apolice.seguradora}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Número: {apolice.numero_apolice}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vigência: {formatDate(apolice.inicio_vigencia)} - {formatDate(apolice.fim_vigencia)}
                        </p>
                        {apolice.valor_total && (
                          <p className="text-sm font-medium text-primary">
                            Valor Total: {formatCurrency(apolice.valor_total)}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={apolice.status === 'ativa' ? 'default' : 'secondary'}
                      >
                        {apolice.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="grid gap-4">
              {submissoes.map((submissao) => (
                <Card key={submissao.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          Protocolo: {submissao.numero_protocolo || 'Aguardando processamento'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Data: {formatDate(submissao.created_at)}
                        </p>
                        {submissao.observacoes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {submissao.observacoes}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          submissao.status === 'recebida' ? 'default' :
                          submissao.status === 'processada' ? 'secondary' : 'destructive'
                        }
                      >
                        {submissao.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};