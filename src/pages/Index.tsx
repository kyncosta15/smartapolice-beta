import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Search, FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, Upload, LogOut, User } from 'lucide-react';
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SmartApólice
                  </h1>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Gestão Inteligente de Apólices
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar apólice, CPF/CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80 bg-white/70 border-gray-200 focus:bg-white"
                  />
                </div>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {dashboardStats.activeAlerts}
                  </span>
                </Button>

                {/* User Menu */}
                <div className="flex items-center space-x-3 pl-4 border-l">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.name}</p>
                  </div>
                  <Button variant="outline" size="icon" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
              <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user?.name}!</h2>
              <p className="opacity-90">
                {user?.role === 'administrador' && 'Você tem acesso total ao sistema de gestão de apólices.'}
                {user?.role === 'cliente' && 'Gerencie suas apólices de forma inteligente e segura.'}
                {user?.role === 'corretora' && 'Administre as apólices dos seus clientes de forma eficiente.'}
              </p>
            </div>

            {/* Dashboard Cards */}
            <DashboardCards stats={dashboardStats} />

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="auto">Seguro Auto</SelectItem>
                  <SelectItem value="vida">Seguro de Vida</SelectItem>
                  <SelectItem value="saude">Seguro Saúde</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="patrimonial">Patrimonial</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Vencendo em 30 dias
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Atenção requerida
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Alto custo
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-fit">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="policies" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Apólices
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Documentos
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alertas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <ChartsSection />
              </TabsContent>

              <TabsContent value="policies" className="space-y-6">
                <PolicyTable 
                  searchTerm={searchTerm}
                  filterType={filterType}
                  onPolicySelect={handlePolicySelect}
                  extractedPolicies={extractedPolicies}
                />
              </TabsContent>

              <TabsContent value="import" className="space-y-6">
                <EnhancedPDFUpload onPolicyExtracted={handlePolicyExtracted} />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <AlertsPanel />
              </TabsContent>
            </Tabs>
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
