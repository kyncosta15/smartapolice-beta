import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, LogOut, Shield, DollarSign, Settings, Phone, Users } from 'lucide-react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { PolicyTable } from '@/components/PolicyTable';
import { ChartsSection } from '@/components/ChartsSection';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { EnhancedPDFUpload } from '@/components/EnhancedPDFUpload';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [extractedPolicies, setExtractedPolicies] = useState([]);
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();

  const handlePolicyExtracted = (policy: any) => {
    console.log('Nova apólice extraída:', policy);
    
    const newPolicy = {
      ...policy,
      status: 'active',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral',
      coverage: ['Cobertura Básica', 'Responsabilidade Civil'],
      monthlyAmount: parseFloat(policy.premium) / 12,
      deductible: Math.floor(Math.random() * 5000) + 1000,
      limits: 'R$ 100.000 por sinistro'
    };
    
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name} foi adicionada ao sistema`,
    });
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handlePolicyUpdate = (updatedPolicy: any) => {
    setExtractedPolicies(prev => 
      prev.map(policy => 
        policy.id === updatedPolicy.id ? updatedPolicy : policy
      )
    );
    
    toast({
      title: "Apólice Atualizada",
      description: "As informações foram salvas com sucesso",
    });
  };

  const handleDeletePolicy = (policyId: string) => {
    const policyToDelete = extractedPolicies.find(p => p.id === policyId);
    if (policyToDelete) {
      setExtractedPolicies(prev => prev.filter(p => p.id !== policyId));
      
      toast({
        title: "Apólice Removida",
        description: "A apólice foi removida com sucesso",
      });
    }
  };

  const mockPolicies = [
    {
      id: '1',
      name: 'Seguro Auto Civic',
      type: 'auto',
      insurer: 'Porto Seguro',
      premium: 14400,
      monthlyAmount: 1200,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      policyNumber: 'PS-2024-001234',
      category: 'Veicular',
      entity: 'Pessoa Física',
      coverage: ['Cobertura Compreensiva', 'Responsabilidade Civil', 'Danos Materiais'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 2500,
      limits: 'R$ 150.000 por sinistro'
    },
    {
      id: '2',
      name: 'Seguro Residencial Plus',
      type: 'patrimonial',
      insurer: 'Mapfre',
      premium: 10206,
      monthlyAmount: 850.50,
      status: 'expiring',
      startDate: '2023-08-20',
      endDate: '2024-08-20',
      policyNumber: 'MF-2023-005678',
      category: 'Imóvel',
      entity: 'Pessoa Física',
      coverage: ['Incêndio', 'Roubo', 'Danos Elétricos'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 1500,
      limits: 'R$ 200.000 por sinistro'
    }
  ];

  const allPolicies = [...mockPolicies, ...extractedPolicies];

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-8">
            <EnhancedDashboard policies={allPolicies} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <PolicyTable 
                  searchTerm={searchTerm}
                  filterType={filterType}
                  onPolicySelect={handlePolicySelect}
                  extractedPolicies={extractedPolicies}
                  onPolicyUpdate={handlePolicyUpdate}
                  onPolicyDelete={handleDeletePolicy}
                />
              </div>
              <div>
                <ChartsSection />
              </div>
            </div>
          </div>
        );
      case 'import':
        return <EnhancedPDFUpload onPolicyExtracted={handlePolicyExtracted} />;
      case 'financial':
        return (
          <div className="space-y-6">
            <EnhancedDashboard policies={allPolicies} />
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Detalhamento Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-green-700 mb-2">Custo Mensal Total</h3>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {allPolicies.reduce((sum, p) => sum + (p.monthlyAmount || p.premium / 12), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Todas as apólices ativas</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-blue-700 mb-2">Total Segurado</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      R$ {allPolicies.reduce((sum, p) => sum + p.premium, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">Valor total dos prêmios</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-purple-700 mb-2">Economia Potencial</h3>
                    <p className="text-3xl font-bold text-purple-600">R$ 2.450</p>
                    <p className="text-sm text-purple-600 mt-1">Com otimização sugerida</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Preferências de Notificação</h3>
                  <p className="text-sm text-gray-600">Configure quando receber alertas sobre vencimentos e renovações.</p>
                </div>
                <div className="p-4 bg-green-50/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Integração com Seguradoras</h3>
                  <p className="text-sm text-gray-600">Conectar APIs para atualização automática de dados.</p>
                </div>
                <div className="p-4 bg-purple-50/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Backup e Segurança</h3>
                  <p className="text-sm text-gray-600">Configurar backup automático dos dados das apólices.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'about':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sobre a SmartApólice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    SmartApólice
                  </h2>
                  <p className="text-gray-600">Gestão Inteligente de Apólices com IA</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl">
                    <h3 className="font-semibold text-blue-800 mb-3">Nossa Missão</h3>
                    <p className="text-gray-700 text-sm">
                      Revolucionar a gestão de seguros através de inteligência artificial,
                      proporcionando controle total e insights estratégicos para nossos usuários.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/30 rounded-xl">
                    <h3 className="font-semibold text-green-800 mb-3">Tecnologia IA</h3>
                    <p className="text-gray-700 text-sm">
                      Utilizamos OCR avançado e processamento inteligente para extrair
                      automaticamente dados de PDFs e imagens, com precisão superior a 95%.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'contact':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Entre em Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50/50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Suporte Técnico</h3>
                    <p className="text-gray-700">suporte@smartapolice.com.br</p>
                    <p className="text-gray-700">(11) 99999-9999</p>
                    <p className="text-sm text-gray-600 mt-2">Segunda a Sexta, 8h às 18h</p>
                  </div>
                  
                  <div className="p-4 bg-green-50/50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Vendas</h3>
                    <p className="text-gray-700">vendas@smartapolice.com.br</p>
                    <p className="text-gray-700">(11) 88888-8888</p>
                    <p className="text-sm text-gray-600 mt-2">Segunda a Sexta, 9h às 17h</p>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-xl">
                  <h3 className="font-semibold text-purple-800 mb-4">Precisa de Ajuda?</h3>
                  <p className="text-gray-700 mb-4">
                    Nossa equipe está pronta para ajudar você a aproveitar ao máximo
                    todas as funcionalidades da SmartApólice.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Agendar Demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return renderContent();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppSidebar onSectionChange={setActiveSection} activeSection={activeSection} />
        <SidebarInset>
          {/* Header with glassmorphism */}
          <header className="border-b bg-white/20 backdrop-blur-xl sticky top-0 z-50 border-white/20">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    SmartApólice
                  </h1>
                  <Badge variant="outline" className="bg-white/20 text-blue-700 border-blue-200/50 backdrop-blur-sm hidden sm:inline-flex">
                    <span className="hidden md:inline">Gestão Inteligente de Apólices</span>
                    <span className="md:hidden">Gestão IA</span>
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar apólice, CPF/CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80 bg-white/20 backdrop-blur-sm border-white/30 focus:bg-white/30 placeholder:text-gray-500"
                  />
                </div>
                <Button variant="ghost" size="icon" className="relative bg-white/10 backdrop-blur-sm hover:bg-white/20">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {allPolicies.filter(p => new Date(p.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                  </span>
                </Button>

                {/* User Menu */}
                <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user?.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} className="bg-white/10 backdrop-blur-sm hover:bg-white/20">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-6">
            {/* Welcome Message with glassmorphism */}
            <div className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-xl p-6 rounded-2xl text-white shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user?.name}!</h2>
              <p className="opacity-90">
                {user?.role === 'administrador' && 'Você tem acesso total ao sistema de gestão de apólices.'}
                {user?.role === 'cliente' && 'Gerencie suas apólices de forma inteligente e segura.'}
                {user?.role === 'corretora' && 'Administre as apólices dos seus clientes de forma eficiente.'}
              </p>
            </div>

            {/* Content */}
            {renderContent()}
          </div>

          {/* Policy Details Modal */}
          <PolicyDetailsModal 
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            policy={selectedPolicy}
            onDelete={handleDeletePolicy}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardContent />;
};

export default Index;
