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
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { IncluirDependenteModal } from '@/components/IncluirDependenteModal';
import { ExcluirColaboradorModal } from '@/components/ExcluirColaboradorModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { useRHDashboardData } from '@/hooks/useRHDashboardData';
import { DynamicCharts } from '@/components/dashboard/DynamicCharts';
import RHDashboard from '@/pages/RHDashboard';
import { SpreadsheetUpload } from '@/components/SpreadsheetUpload';
import { PlanilhaHistorico } from '@/components/PlanilhaHistorico';
import { ColaboradorModal } from '@/components/ColaboradorModal';
import { ApoliceCNPJView } from '@/components/ApoliceCNPJView';
import { ProtocolosDashboard } from '@/components/ProtocolosDashboard';
import { ProtocolosAdminDashboard } from '@/components/ProtocolosAdminDashboard';
import { RequestsNewDashboard } from '@/components/RequestsNewDashboard';
import { AdminRequestsDashboard } from '@/components/AdminRequestsDashboard';
import { AdminTicketsDashboard } from '@/components/AdminTicketsDashboard';
import { EmployeesListNew } from '@/components/EmployeesListNew';
import { ConsolidatedReportPDF } from '@/components/ConsolidatedReportPDF';
import { TicketsReportPDF } from '@/components/TicketsReportPDF';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSyncDashboard } from '@/hooks/useSyncDashboard';

// Dados mock para demonstração
const mockData = {
  vidasAtivas: 615,
  custoMensal: 325400.00,
  custoMedioVida: 520.00,
  vencimentosProximos: 8,
  ticketsAbertos: 12,
  colaboradoresAtivos: 98,
  dependentesAtivos: 47,
  ticketsPendentes: 5
};

// Dados para gráficos
const vidasAtivasData = [
  { mes: 'Jan', valor: 580 },
  { mes: 'Fev', valor: 590 },
  { mes: 'Mar', valor: 605 },
  { mes: 'Abr', valor: 615 },
  { mes: 'Mai', valor: 610 },
  { mes: 'Jun', valor: 615 }
];

const custoMensalData = [
  { mes: 'Jan', valor: 310000 },
  { mes: 'Fev', valor: 315000 },
  { mes: 'Mar', valor: 320000 },
  { mes: 'Abr', valor: 325400 },
  { mes: 'Mai', valor: 322000 },
  { mes: 'Jun', valor: 325400 }
];

const custoMedioVidaData = [
  { mes: 'Jan', valor: 534 },
  { mes: 'Fev', valor: 533 },
  { mes: 'Mar', valor: 528 },
  { mes: 'Abr', valor: 520 },
  { mes: 'Mai', valor: 527 },
  { mes: 'Jun', valor: 520 }
];

const sinistrosData = [
  { name: 'Consultas', value: 45, color: '#3b82f6' },
  { name: 'Exames', value: 25, color: '#10b981' },
  { name: 'Internações', value: 20, color: '#f59e0b' },
  { name: 'Outros', value: 10, color: '#ef4444' }
];

const statusIngressosData = [
  { name: 'Aprovados', value: 35, color: '#10b981' },
  { name: 'Em análise', value: 15, color: '#f59e0b' },
  { name: 'Pendentes', value: 10, color: '#ef4444' }
];

const centrosCustoData = [
  { name: 'Administração', valor: 85000, cor: '#3b82f6' },
  { name: 'Vendas', valor: 75000, cor: '#10b981' },
  { name: 'TI', valor: 65000, cor: '#f59e0b' },
  { name: 'RH', valor: 45000, cor: '#ef4444' },
  { name: 'Operações', valor: 55000, cor: '#8b5cf6' }
];

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

export const SmartBeneficiosDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { metrics, colaboradores, dependentes, empresas, tickets, apolices, colaboradorLinks, submissoes, isLoading, error, loadData } = useSmartBeneficiosData();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { syncDashboardData, forceRefresh, isSyncing } = useSyncDashboard();

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
              <img 
                src="/lovable-uploads/35e23026-c0af-40fa-b1db-60e8adc5169f.png" 
                alt="SmartBenefícios Logo" 
                className="h-4 w-4 sm:h-6 sm:w-6 object-contain" 
              />
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
                    <Badge variant={profile.role === 'administrador' || (profile as any).role === 'corretora_admin' ? 'default' : 'secondary'} className="text-xs">
                      {profile.role === 'administrador' ? 'Administrador' : (profile as any).role === 'corretora_admin' ? 'Corretor Admin' : 'RH'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
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
          <div className="relative mb-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 rounded-2xl p-1 h-auto relative overflow-hidden">
              {/* Background blur effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-white/40 to-purple-50/40 rounded-2xl"></div>
              
              <TabsTrigger 
                value="dashboard" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="colaboradores" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Colaboradores
              </TabsTrigger>
              <TabsTrigger 
                value="solicitacoes" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Solicitações
              </TabsTrigger>
              <TabsTrigger 
                value="protocolos" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Protocolos
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Gestão
              </TabsTrigger>
              <TabsTrigger 
                value="relatorios" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Relatórios
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="text-xs sm:text-sm relative z-10 bg-transparent hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-500 ease-out py-3 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] font-medium backdrop-blur-sm border-0 data-[state=active]:shadow-blue-100/50"
              >
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DynamicCharts 
              colaboradores={colaboradores}
              dependentes={dependentes}
              tickets={tickets}
              apolices={apolices}
              metrics={metrics}
            />

          </TabsContent>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores">
            <EmployeesListNew />
          </TabsContent>

          {/* Solicitações Tab */}
          <TabsContent value="solicitacoes">
            <RequestsNewDashboard />
          </TabsContent>

          {/* Protocolos Tab */}
          <TabsContent value="protocolos">
            <ProtocolosAdminDashboard submissoes={submissoes} isLoading={isLoading} />
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
            <AdminTicketsDashboard />
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="relatorios">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Relatório Consolidado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Relatório consolidado geral
                  </p>
                  <div className="flex flex-col gap-2">
                    <ConsolidatedReportPDF className="w-full text-xs sm:text-sm h-8 sm:h-10" />
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
                    <TicketsReportPDF className="w-full text-xs sm:text-sm h-8 sm:h-10" />
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