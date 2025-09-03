import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Heart,
  DollarSign, 
  Clock, 
  FileText, 
  Plus,
  Download,
  Filter,
  Search,
  AlertTriangle,
  LogOut,
  User
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { SpreadsheetUpload } from '@/components/SpreadsheetUpload';
import { PlanilhaHistorico } from '@/components/PlanilhaHistorico';
import { ColaboradorModal } from '@/components/ColaboradorModal';
import { ApoliceCNPJView } from '@/components/ApoliceCNPJView';
import { GeradorLinksColaborador } from '@/components/GeradorLinksColaborador';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Dados mock para demonstração
const mockData = {
  vidasAtivas: 145,
  custoMensal: 48500.00,
  custoMedioVida: 334.48,
  vencimentosProximos: 8,
  ticketsAbertos: 12,
  colaboradoresAtivos: 98,
  dependentesAtivos: 47,
  ticketsPendentes: 5
};

const mockColaboradores = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    cargo: 'Analista Financeiro',
    centroCusto: 'Financeiro',
    status: 'ativo',
    custoMensal: 280.00,
    dependentes: 2,
    dataAdmissao: '2023-01-15'
  },
  {
    id: '2', 
    nome: 'João Pedro Oliveira',
    cpf: '987.654.321-00',
    cargo: 'Desenvolvedor Senior',
    centroCusto: 'TI',
    status: 'ativo',
    custoMensal: 420.00,
    dependentes: 1,
    dataAdmissao: '2022-08-10'
  }
];

const mockTickets = [
  {
    id: '1',
    numero: 'SB202501000001',
    colaborador: 'Maria Silva Santos',
    tipo: 'inclusao_dependente',
    status: 'em_validacao',
    dataRecebimento: '2025-01-02',
    canal: 'whatsapp'
  },
  {
    id: '2',
    numero: 'SB202501000002', 
    colaborador: 'João Pedro Oliveira',
    tipo: 'segunda_via_carteirinha',
    status: 'concluido',
    dataRecebimento: '2025-01-01',
    canal: 'whatsapp'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativo': return 'bg-green-500';
    case 'inativo': return 'bg-gray-500';
    case 'pendente': return 'bg-yellow-500';
    case 'recebido': return 'bg-blue-500';
    case 'em_validacao': return 'bg-orange-500';
    case 'em_execucao': return 'bg-purple-500';
    case 'concluido': return 'bg-green-500';
    case 'cancelado': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getTipoTicketLabel = (tipo: string) => {
  switch (tipo) {
    case 'inclusao_dependente': return 'Inclusão Dependente';
    case 'exclusao_dependente': return 'Exclusão Dependente';
    case 'duvida_cobertura': return 'Dúvida Cobertura';
    case 'segunda_via_carteirinha': return '2ª Via Carteirinha';
    case 'duvida_geral': return 'Dúvida Geral';
    default: return tipo;
  }
};

// Atualizar o dashboard para usar dados reais
export const SmartBeneficiosDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { metrics, colaboradores, tickets, apolices, colaboradorLinks, submissoes, isLoading, error, loadData } = useSmartBeneficiosData();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/system-selection');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">SmartBenefícios</h1>
              <p className="text-sm text-muted-foreground">Portal RH/Financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Informações do usuário */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(user.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            
            <Badge className="bg-green-100 text-green-800 border-green-300">
              {isLoading ? 'Carregando...' : 'SmartBenefícios Ativo'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="apolices">Apólices</TabsTrigger>
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="tickets">Solicitações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vidas Ativas</p>
                      <p className="text-2xl font-bold">{isLoading ? '...' : metrics.vidasAtivas}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Custo Mensal</p>
                      <p className="text-2xl font-bold">{isLoading ? '...' : formatCurrency(metrics.custoMensal)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Custo Médio/Vida</p>
                      <p className="text-2xl font-bold">{isLoading ? '...' : formatCurrency(metrics.custoMedioVida)}</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tickets Abertos</p>
                      <p className="text-2xl font-bold">{isLoading ? '...' : metrics.ticketsAbertos}</p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vencimentos e Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Vencimentos Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">Plano de Saúde - Janeiro</p>
                        <p className="text-sm text-muted-foreground">Vence em 5 dias</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Urgente</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Plano Odontológico - Janeiro</p>
                        <p className="text-sm text-muted-foreground">Vence em 8 dias</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Status dos Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: 'Em Validação', count: 3, color: 'orange' },
                      { status: 'Em Execução', count: 4, color: 'purple' },
                      { status: 'Pendente Cliente', count: 2, color: 'yellow' },
                      { status: 'Concluídos Hoje', count: 8, color: 'green' }
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <span className="text-sm">{item.status}</span>
                        <Badge className={`bg-${item.color}-100 text-${item.color}-800`}>
                          {item.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Apólices Tab */}
          <TabsContent value="apolices" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestão de Apólices</h2>
              <Badge className="bg-blue-100 text-blue-800">
                {isLoading ? '...' : `${apolices.length} apólice${apolices.length !== 1 ? 's' : ''}`}
              </Badge>
            </div>
            
            <ApoliceCNPJView apolices={apolices} isLoading={isLoading} />
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Links para Colaboradores</h2>
              <Badge className="bg-purple-100 text-purple-800">
                {isLoading ? '...' : `${colaboradorLinks.length} link${colaboradorLinks.length !== 1 ? 's' : ''}`}
              </Badge>
            </div>
            
            <GeradorLinksColaborador 
              colaboradorLinks={colaboradorLinks} 
              submissoes={submissoes}
              isLoading={isLoading} 
            />
          </TabsContent>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestão de Colaboradores</h2>
              <ColaboradorModal>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Incluir Colaborador
                </Button>
              </ColaboradorModal>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Colaboradores Ativos</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        className="pl-10 pr-4 py-2 border rounded-md w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Carregando colaboradores...</p>
                  </div>
                ) : colaboradores.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum colaborador encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Faça upload de uma planilha para importar colaboradores
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {colaboradores
                      .filter(colaborador => 
                        colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        colaborador.cpf.includes(searchTerm) ||
                        colaborador.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        colaborador.centro_custo?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((colaborador) => (
                        <div key={colaborador.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{colaborador.nome}</h3>
                                <Badge className={getStatusColor(colaborador.status) + ' text-white'}>
                                  {colaborador.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {colaborador.cargo} • {colaborador.centro_custo} • CPF: {colaborador.cpf}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Custo: {formatCurrency(colaborador.custo_mensal || 0)}
                                {colaborador.email && ` • ${colaborador.email}`}
                              </p>
                              {colaborador.data_admissao && (
                                <p className="text-xs text-muted-foreground">
                                  Admissão: {new Date(colaborador.data_admissao).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                Editar
                              </Button>
                              <Button variant="outline" size="sm">
                                Histórico
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Solicitações</h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {isLoading ? '...' : `${tickets.length} tickets`}
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tickets Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Carregando tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum ticket encontrado</h3>
                    <p className="text-muted-foreground">
                      Ainda não há solicitações registradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{ticket.numero_ticket}</Badge>
                            <Badge className={getStatusColor(ticket.status) + ' text-white'}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {ticket.canal_origem && (
                            <Badge className="bg-gray-100 text-gray-800">
                              {ticket.canal_origem}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{ticket.titulo}</h4>
                          {ticket.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {ticket.descricao}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Tipo: {getTipoTicketLabel(ticket.tipo)}
                          </p>
                          {ticket.data_recebimento && (
                            <p className="text-xs text-muted-foreground">
                              Recebido em: {new Date(ticket.data_recebimento).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="relatorios" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Relatórios e Exportações</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Relatório Consolidado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Relatório completo com todos os colaboradores, dependentes e custos
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Relatório de Tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Histórico completo de solicitações por período
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custo por Centro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Análise de custos segmentada por centro de custo
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="space-y-6">
              <SpreadsheetUpload 
                onFileSelect={(file) => console.log('Arquivo selecionado:', file)}
                onDataUpdate={loadData}
              />
              
              <PlanilhaHistorico />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};