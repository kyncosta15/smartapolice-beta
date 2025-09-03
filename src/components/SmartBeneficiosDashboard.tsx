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
import { formatCurrency } from '@/utils/currencyFormatter';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { SpreadsheetUpload } from '@/components/SpreadsheetUpload';
import { PlanilhaHistorico } from '@/components/PlanilhaHistorico';
import { ColaboradorModal } from '@/components/ColaboradorModal';
import { ApoliceCNPJView } from '@/components/ApoliceCNPJView';
import { GeradorLinksColaborador } from '@/components/GeradorLinksColaborador';
import { ProtocolosDashboard } from '@/components/ProtocolosDashboard';
import { RequestsDashboard } from '@/components/RequestsDashboard';
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
            {user && profile && (
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(profile.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{profile.full_name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500">{profile.email}</p>
                    <Badge variant={profile.role === 'administrador' || profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {profile.role === 'administrador' ? 'Admin' : 
                       profile.role === 'admin' ? 'Admin' :
                       profile.role === 'rh' ? 'RH' : 'Financeiro'}
                    </Badge>
                  </div>
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="apolices">Apólices</TabsTrigger>
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
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
            <div>
              <h2 className="text-2xl font-bold">Gerador de Links</h2>
              <p className="text-muted-foreground">
                Gere links personalizados para colaboradores preencherem solicitações
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Link Público de Solicitações</h3>
              <p className="text-blue-700 mb-4">
                Os colaboradores agora podem acessar diretamente a página de solicitações sem necessidade de links individuais.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-3 bg-white rounded border font-mono text-sm">
                  {window.location.origin}/solicitacao
                </div>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/solicitacao`);
                    toast.success('Link copiado!');
                  }}
                  variant="outline"
                >
                  Copiar Link
                </Button>
              </div>
              <p className="text-sm text-blue-600 mt-3">
                💡 Mensagem sugerida para WhatsApp: "Olá! Para incluir ou excluir beneficiários do seu plano, acesse este link seguro: {window.location.origin}/solicitacao. Informe seu CPF e nome, siga os passos e no final você receberá o protocolo."
              </p>
            </div>
          </TabsContent>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores" className="space-y-6">
            <EmployeesList />
          </TabsContent>

          {/* Solicitações Tab */}
          <TabsContent value="solicitacoes" className="space-y-6">
            <RequestsDashboard />
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