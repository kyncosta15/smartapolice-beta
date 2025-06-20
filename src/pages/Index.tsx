import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Search, FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, Upload, LogOut, User, DollarSign, Settings, Phone, Home } from 'lucide-react';
import { DashboardCards } from '@/components/DashboardCards';
import { PolicyTable } from '@/components/PolicyTable';
import { ChartsSection } from '@/components/ChartsSection';
import { AlertsPanel } from '@/components/AlertsPanel';
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
  const [dashboardStats, setDashboardStats] = useState({
    totalPolicies: 0,
    monthlyCost: 0,
    totalInsured: 0,
    activeAlerts: 0
  });
  const { toast } = useToast();

  const handlePolicyExtracted = (policy: any) => {
    console.log('Nova apólice extraída:', policy);
    
    const newPolicy = {
      ...policy,
      status: 'active',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral'
    };
    
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    // Atualiza as estatísticas do dashboard
    setDashboardStats(prev => ({
      ...prev,
      totalPolicies: prev.totalPolicies + 1,
      monthlyCost: prev.monthlyCost + (parseFloat(policy.premium) / 12),
      totalInsured: prev.totalInsured + parseFloat(policy.premium) * 10,
      activeAlerts: prev.activeAlerts + (Math.random() > 0.7 ? 1 : 0)
    }));
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name} foi adicionada ao sistema`,
    });
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    const policyToDelete = extractedPolicies.find(p => p.id === policyId);
    if (policyToDelete) {
      setExtractedPolicies(prev => prev.filter(p => p.id !== policyId));
      
      // Atualiza as estatísticas
      setDashboardStats(prev => ({
        ...prev,
        totalPolicies: Math.max(0, prev.totalPolicies - 1),
        monthlyCost: Math.max(0, prev.monthlyCost - (parseFloat(policyToDelete.premium) / 12)),
        totalInsured: Math.max(0, prev.totalInsured - parseFloat(policyToDelete.premium) * 10),
      }));
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-6">
            <DashboardCards stats={dashboardStats} />
            <ChartsSection />
            <PolicyTable 
              searchTerm={searchTerm}
              filterType={filterType}
              onPolicySelect={handlePolicySelect}
              extractedPolicies={extractedPolicies}
            />
          </div>
        );
      case 'import':
        return <EnhancedPDFUpload onPolicyExtracted={handlePolicyExtracted} />;
      case 'financial':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-700">Custo Mensal Total</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {dashboardStats.monthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700">Total Segurado</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {dashboardStats.totalInsured.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-700">Apólices Ativas</h3>
                  <p className="text-2xl font-bold text-purple-600">{dashboardStats.totalPolicies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configurações do sistema em desenvolvimento.</p>
            </CardContent>
          </Card>
        );
      case 'about':
        return (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Quem Somos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  A SmartApólice é uma plataforma inovadora de gestão inteligente de apólices de seguro,
                  desenvolvida para simplificar e otimizar o controle de seus seguros.
                </p>
                <p className="text-gray-700">
                  Utilizamos tecnologia de ponta com inteligência artificial para extrair e organizar
                  automaticamente as informações de suas apólices, proporcionando uma visão completa
                  e organizada de todos os seus seguros.
                </p>
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
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">E-mail</h3>
                  <p className="text-gray-600">contato@smartapolice.com.br</p>
                </div>
                <div>
                  <h3 className="font-semibold">Telefone</h3>
                  <p className="text-gray-600">(11) 99999-9999</p>
                </div>
                <div>
                  <h3 className="font-semibold">Suporte</h3>
                  <p className="text-gray-600">suporte@smartapolice.com.br</p>
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
                    {dashboardStats.activeAlerts}
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
