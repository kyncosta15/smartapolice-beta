
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Search, Plus, FileText, Users, Calendar, TrendingUp, AlertTriangle, Shield, Upload, LogOut, User } from 'lucide-react';
import { DashboardCards } from '@/components/DashboardCards';
import { PolicyTable } from '@/components/PolicyTable';
import { ChartsSection } from '@/components/ChartsSection';
import { AlertsPanel } from '@/components/AlertsPanel';
import { PolicyModal } from '@/components/PolicyModal';
import { EnhancedPDFUpload } from '@/components/EnhancedPDFUpload';
import { useToast } from '@/hooks/use-toast';

const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalPolicies: 247,
    monthlyCost: 127850,
    totalInsured: 25400000,
    activeAlerts: 7
  });
  const { toast } = useToast();

  const handlePolicyExtracted = (policy: any) => {
    console.log('Nova apólice extraída:', policy);
    
    // Atualiza as estatísticas do dashboard
    setDashboardStats(prev => ({
      ...prev,
      totalPolicies: prev.totalPolicies + 1,
      monthlyCost: prev.monthlyCost + (parseFloat(policy.premium) / 12),
      totalInsured: prev.totalInsured + parseFloat(policy.premium) * 10 // Simula valor segurado
    }));
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name} foi adicionada ao sistema`,
    });
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      cliente: 'Cliente',
      administrador: 'Administrador',
      corretora: 'Corretora'
    };
    return roles[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      cliente: 'bg-blue-100 text-blue-700',
      administrador: 'bg-purple-100 text-purple-700',
      corretora: 'bg-green-100 text-green-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SecureHub
                </h1>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Gestão Inteligente de Apólices
              </Badge>
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
                  3
                </span>
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Apólice
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <Badge className={`text-xs ${getRoleBadgeColor(user?.role || '')}`}>
                    {getRoleLabel(user?.role || '')}
                  </Badge>
                </div>
                <Button variant="outline" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
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
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
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
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
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
              onPolicySelect={setSelectedPolicy}
            />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <EnhancedPDFUpload onPolicyExtracted={handlePolicyExtracted} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ChartsSection detailed={true} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Policy Modal */}
      <PolicyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        policy={selectedPolicy}
      />
    </div>
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
