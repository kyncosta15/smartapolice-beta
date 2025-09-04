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
  User,
  MessageCircle
} from 'lucide-react';
import { IncluirDependenteModal } from '@/components/IncluirDependenteModal';
import { ExcluirColaboradorModal } from '@/components/ExcluirColaboradorModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { useRHDashboardData } from '@/hooks/useRHDashboardData';
import RHDashboard from '@/pages/RHDashboard';
import { SpreadsheetUpload } from '@/components/SpreadsheetUpload';
import { PlanilhaHistorico } from '@/components/PlanilhaHistorico';
import { ColaboradorModal } from '@/components/ColaboradorModal';
import { ApoliceCNPJView } from '@/components/ApoliceCNPJView';
import { ProtocolosDashboard } from '@/components/ProtocolosDashboard';
import { RequestsNewDashboard } from '@/components/RequestsNewDashboard';
// Link generator removed - now using public page
import { EmployeesList } from '@/components/EmployeesList';
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
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Se o usuário for "Gestão RH", mostrar o dashboard executivo diretamente
  const userClassification = (profile as any)?.classification || (user as any)?.classification || 'Corretora';
  
  if (userClassification === 'Gestão RH') {
    return <RHDashboard />;
  }

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
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
              <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-primary">SmartBenefícios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Portal RH/Financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Informações do usuário */}
            {user && profile && (
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-2 bg-gray-50 rounded-lg">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-primary text-white text-xs sm:text-sm">
                    {getInitials(profile.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs sm:text-sm hidden md:block">
                  <p className="font-medium text-gray-900">{profile.full_name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 hidden lg:block">{profile.email}</p>
                    <Badge variant={profile.role === 'administrador' || profile.role === 'admin' || profile.role === 'corretora_admin' ? 'default' : 'secondary'} className="text-xs">
                      {profile.role === 'administrador' ? 'Admin' : 
                       profile.role === 'admin' ? 'Admin' :
                       profile.role === 'corretora_admin' ? 'Corretora' :
                       profile.role === 'rh' ? 'RH' : 'Financeiro'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <Button variant="outline" size="sm" className="hidden sm:flex text-xs">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:block">Exportar</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:block">Sair</span>
            </Button>
            
            <Badge className="bg-green-100 text-green-800 border-green-300 text-xs hidden lg:block">
              {isLoading ? 'Carregando...' : 'SmartBenefícios Ativo'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-4 overflow-x-auto">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="apolices" className="text-xs sm:text-sm">Apólices</TabsTrigger>
            <TabsTrigger value="colaboradores" className="text-xs sm:text-sm">Colaboradores</TabsTrigger>
            <TabsTrigger value="solicitacoes" className="text-xs sm:text-sm">Solicitações</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs sm:text-sm">Tickets</TabsTrigger>
            <TabsTrigger value="relatorios" className="text-xs sm:text-sm">Relatórios</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm">Upload</TabsTrigger>
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


          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Colaboradores</h2>
                <p className="text-muted-foreground">Gerencie colaboradores e dependentes</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <IncluirDependenteModal>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Incluir Colaborador
                  </Button>
                </IncluirDependenteModal>
                
                <ExcluirColaboradorModal>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Excluir Colaboradores
                  </Button>
                </ExcluirColaboradorModal>
              </div>
            </div>
            
            <EmployeesList />
          </TabsContent>

          {/* Solicitações Tab */}
          <TabsContent value="solicitacoes" className="space-y-6">
            <RequestsNewDashboard />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gestão de Tickets</h2>
              <Badge className="bg-blue-100 text-blue-800">
                {isLoading ? '...' : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`}
              </Badge>
            </div>
            
            <ProtocolosDashboard submissoes={submissoes} isLoading={isLoading} />
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="relatorios" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Relatórios e Exportações</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Relatório Consolidado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Relatório completo com todos os colaboradores, dependentes e custos
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Relatório de Tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Histórico completo de solicitações por período
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Custo por Centro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Análise de custos segmentada por centro de custo
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-10">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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