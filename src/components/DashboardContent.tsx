import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInfoCapSync } from '@/hooks/useInfoCapSync';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { Navbar } from '@/components/Navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardCards } from '@/components/DashboardCards';
import { DynamicDashboard } from '@/components/DynamicDashboard';
import { ContentRenderer } from '@/components/ContentRenderer';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useProgressToast } from '@/hooks/use-progress-toast';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { usePersistedUsers } from '@/hooks/usePersistedUsers';
import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';
import { 
  createExtendedInstallments,
  filterOverdueInstallments
} from '@/utils/installmentUtils';
import { 
  Home,
  FileText, 
  BarChart3, 
  Users2,
  User,
  Car,
  Calculator,
  ShieldAlert,
  Settings,
  Upload,
  Mail
} from "lucide-react";

export function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [extractedPolicies, setExtractedPolicies] = useState<ParsedPolicyData[]>([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadViewState, setUploadViewState] = useState<{
    refreshToken: number;
    highlightPolicyId: string | null;
    initialStatusFilter: 'todas' | 'vigentes' | 'antigas';
  }>({
    refreshToken: 0,
    highlightPolicyId: null,
    initialStatusFilter: 'vigentes'
  });
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { progressToast } = useProgressToast();
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook para persistência de apólices
  const { 
    policies: persistedPolicies, 
    addPolicy: addPersistedPolicy, 
    deletePolicy: deletePersistedPolicy,
    updatePolicy: updatePersistedPolicy,
    downloadPDF: downloadPersistedPDF,
    refreshPolicies,
    hasPersistedData 
  } = usePersistedPolicies();

  // Hook para persistência de usuários baseado em role
  const { 
    users: persistedUsers, 
    updateUser, 
    deleteUser, 
    addUser,
    canManageUsers,
    isLoading: usersLoading
  } = usePersistedUsers();

  // Hook para sincronização InfoCap
  const { syncPolicies: syncInfoCapPolicies, isSyncing } = useInfoCapSync();

  // Combinar apólices extraídas e persistidas, evitando duplicatas
  const allPolicies = [...extractedPolicies, ...persistedPolicies.filter(
    pp => !extractedPolicies.some(ep => ep.id === pp.id)
  )];

  // Usar o hook de dashboard data com todas as apólices
  const { dashboardData } = useDashboardData(allPolicies);

  // Calcular estatísticas de parcelas com TODAS as apólices (incluindo persistidas)
  const allInstallments = createExtendedInstallments(allPolicies);
  const overdueInstallments = filterOverdueInstallments(allInstallments);
  
  // Calcular apólices vigentes que vencem em 30/60 dias
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  
  const in60Days = new Date(today);
  in60Days.setDate(in60Days.getDate() + 60);
  
  const policiesExpiring30Days = allPolicies.filter(policy => {
    // Apenas apólices vigentes
    const status = policy.status?.toLowerCase();
    if (status !== 'vigente' && status !== 'ativa' && status !== 'vencendo') return false;
    
    const expirationDate = new Date(policy.expirationDate || policy.endDate);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate >= today && expirationDate <= in30Days;
  }).length;
  
  const policiesExpiring60Days = allPolicies.filter(policy => {
    // Apenas apólices vigentes
    const status = policy.status?.toLowerCase();
    if (status !== 'vigente' && status !== 'ativa' && status !== 'vencendo') return false;
    
    const expirationDate = new Date(policy.expirationDate || policy.endDate);
    expirationDate.setHours(0, 0, 0, 0);
    return expirationDate >= today && expirationDate <= in60Days;
  }).length;

  // Criar estatísticas atualizadas para o dashboard
  const enhancedDashboardStats = {
    ...dashboardData,
    overdueInstallments: overdueInstallments.length,
    duingNext30Days: policiesExpiring30Days,
    duingNext60Days: policiesExpiring60Days,
    renovadas: dashboardData.renewalDistribution?.renovadas ?? 0,
    naoRenovadas: dashboardData.renewalDistribution?.naoRenovadas ?? 0
  };

  // Navigation items - role-based visibility per specifications
  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'seguro-garantia', title: 'Seguro Garantia', icon: FileText },
    { id: 'fianca-locaticia', title: 'Fiança Locatícia', icon: FileText },
    { id: 'export', title: 'Relatório', icon: BarChart3 },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'seguro-garantia', title: 'Seguro Garantia', icon: FileText },
    { id: 'fianca-locaticia', title: 'Fiança Locatícia', icon: FileText },
    { id: 'export', title: 'Relatório', icon: BarChart3 },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const navigation = (['administrador', 'admin', 'corretora_admin'].includes(user?.role || '')) ? adminNavigation : clientNavigation;

  const handleManualRefresh = async () => {
    console.log('🔄 [handleManualRefresh] Refresh manual iniciado');
    setIsRefreshing(true);
    
    try {
      // 1. Sincronizar do InfoCap - a edge function processa documento principal + vínculos
      try {
        // Buscar documento principal do usuário (pode ser null)
        const { data: userData } = await supabase
          .from('users')
          .select('documento')
          .eq('id', user?.id)
          .maybeSingle();

        console.log('📡 Sincronizando apólices do InfoCap...');
        console.log(`📄 Documento principal: ${userData?.documento || '(nenhum)'}`);
        
        // Chamar sincronização - a edge function buscará vínculos automaticamente
        // Mesmo sem documento principal, os vínculos serão processados
        await syncInfoCapPolicies(userData?.documento || null);
      } catch (syncError) {
        console.warn('⚠️ Erro na sincronização InfoCap:', syncError);
        // Continuar mesmo com erro na sincronização
      }

      // 2. Atualizar apólices do banco local
      await refreshPolicies();
      setLastRefresh(Date.now());
      
      console.log('✅ [handleManualRefresh] Refresh concluído');
    } catch (error) {
      console.error('❌ [handleManualRefresh] Erro no refresh:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePolicyExtracted = async (policy: any) => {
    console.log('🚀 handlePolicyExtracted CHAMADO - Recarregando dados do banco!');
    console.log('Apólice extraída/atualizada:', policy.name);
    
    // CRÍTICO: Sempre recarregar do banco após processar apólice
    // Isso garante que tanto novas apólices quanto atualizações sejam refletidas
    console.log('🔄 Forçando reload das apólices do banco...');
    
    await refreshPolicies();
    setLastRefresh(Date.now());
    
    console.log('✅ Apólices recarregadas do banco');
  };

  const handleUploadComplete = ({ policies }: { policies: any[] }) => {
    const latestPolicy = policies[policies.length - 1] || null;

    setUploadViewState({
      refreshToken: Date.now(),
      highlightPolicyId: latestPolicy?.id ?? null,
      initialStatusFilter: 'todas'
    });

    setActiveSection('policies');
  };

  // Função auxiliar para gerar parcelas a partir de um número
  const generateInstallmentsFromNumber = (numberOfInstallments: number, monthlyAmount: number, startDate: string) => {
    const installments = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: monthlyAmount,
        data: installmentDate.toISOString().split('T')[0],
        status: installmentDate < new Date() ? 'paga' : 'pendente'
      });
    }
    
    return installments;
  };

  // Função auxiliar para gerar parcelas padrão
  const generateDefaultInstallments = (monthlyAmount: number, startDate: string) => {
    return generateInstallmentsFromNumber(12, monthlyAmount || 100, startDate);
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handlePolicyUpdate = async (updatedPolicy: any) => {
    // Tentar atualizar no banco primeiro (se for persistida)
    const isPersistedPolicy = persistedPolicies.some(p => p.id === updatedPolicy.id);
    
    if (isPersistedPolicy) {
      const success = await updatePersistedPolicy(updatedPolicy.id, updatedPolicy);
      if (!success) return; // Erro já mostrado no hook
    } else {
      // Atualizar apenas no estado local (apólices extraídas)
      setExtractedPolicies(prev => 
        prev.map(policy => 
          policy.id === updatedPolicy.id ? updatedPolicy : policy
        )
      );
      
      toast({
        title: "Apólice Atualizada",
        description: "As informações foram salvas com sucesso",
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    console.log(`🗑️ Tentando deletar apólice: ${policyId}`);
    
    // Tentar deletar do banco primeiro (se for persistida)
    const isPersistedPolicy = persistedPolicies.some(p => p.id === policyId);
    
    if (isPersistedPolicy) {
      console.log('📝 Apólice persistida - usando deleção do banco');
      const success = await deletePersistedPolicy(policyId);
      if (!success) {
        console.error('❌ Falha na deleção da apólice persistida');
      }
    } else {
      console.log('📝 Apólice local - removendo do estado');
      // Deletar apenas do estado local (apólices extraídas)
      const policyToDelete = extractedPolicies.find(p => p.id === policyId);
      if (policyToDelete) {
        setExtractedPolicies(prev => prev.filter(p => p.id !== policyId));
        
        toast({
          title: "✅ Apólice Removida",
          description: "A apólice foi removida com sucesso",
        });
      }
    }
  };

  const handleUserUpdate = async (updatedUser: any) => {
    const success = await updateUser(updatedUser.id, updatedUser);
    // O toast já é mostrado no hook usePersistedUsers
    if (!success) {
      // Toast de erro já foi mostrado no hook
    }
  };

  const handleUserDelete = async (userId: string) => {
    await deleteUser(userId);
    // O toast já é mostrado no hook usePersistedUsers
  };

  // Normalizar dados das apólices para garantir compatibilidade com todos os componentes
  // IMPORTANTE: Usar allPolicies (que inclui persistidas) e não apenas extractedPolicies
  const normalizedPolicies = allPolicies.map(policy => ({
    ...policy,
    // Manter installments como array - já é o formato correto
    installments: policy.installments
  }));

  console.log(`🔍 DashboardContent: Total de apólices (incluindo persistidas): ${allPolicies.length}`);
  console.log(`📊 Apólices persistidas: ${persistedPolicies.length}, Extraídas: ${extractedPolicies.length}`);
  console.log(`🔍 Status dos hooks - Persisted loading:`, hasPersistedData);
  console.log(`🔍 Dashboard Stats:`, enhancedDashboardStats);
  console.log(`🔍 Normalized Policies (primeiras 3):`, normalizedPolicies.slice(0, 3));
  console.log(`🔍 Usuário atual:`, { id: user?.id, email: user?.email, role: user?.role });
  
  // Auto-refresh quando voltar para o dashboard
  useEffect(() => {
    if (activeSection === 'dashboard') {
      console.log('🔄 Dashboard ativo - verificando se precisa atualizar dados');
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      
      // Se passou mais de 2 segundos desde o último refresh, recarregar
      if (timeSinceLastRefresh > 2000) {
        console.log('🔄 Recarregando dados do banco...');
        refreshPolicies().then(() => {
          console.log('✅ Dados atualizados');
          setLastRefresh(Date.now());
        });
      }
    }
  }, [activeSection]);
  
  // Verificação crítica de autenticação
  if (!user?.id) {
    console.error('❌ ERRO CRÍTICO: Usuário não autenticado! Redirecionando para login...');
    toast({
      title: "Sessão Expirada",
      description: "Faça login novamente para acessar suas apólices",
      variant: "destructive",
    });
  }
  
  // DEBUG: Verificar se as apólices têm documento_tipo - SAFE LOGGING
  console.log('🔍 DEBUG DOCUMENTO_TIPO:', normalizedPolicies.map(p => ({
    id: p.id,
    name: p.name && typeof p.name === 'string' ? p.name : 'N/A',
    documento_tipo: p.documento_tipo && typeof p.documento_tipo === 'string' ? p.documento_tipo : 'N/A',
    documento: p.documento && typeof p.documento === 'string' ? p.documento : 'N/A'
  })));

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigation={navigation}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Desktop Sidebar */}
        <AppSidebar 
          onSectionChange={setActiveSection} 
          activeSection={activeSection} 
        />
        
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Navbar 
            onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />

        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Complete Dashboard Content */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Dashboard Cards */}
              <DashboardCards 
                dashboardStats={{
                  totalPolicies: enhancedDashboardStats.totalPolicies,
                  expiringPolicies: enhancedDashboardStats.expiringPolicies || 0,
                  duingNext30Days: enhancedDashboardStats.duingNext30Days,
                  duingNext60Days: enhancedDashboardStats.duingNext60Days,
                  totalMonthlyCost: enhancedDashboardStats.totalMonthlyCost || 0,
                  totalInsuredValue: enhancedDashboardStats.totalInsuredValue || 0,
                  renovadas: enhancedDashboardStats.renovadas || 0,
                  naoRenovadas: enhancedDashboardStats.naoRenovadas || 0,
                }} 
                isLoading={false}
                onSectionChange={setActiveSection}
              />
              
              {/* Complete Dashboard with Charts - hide cards section to avoid duplication */}
              <div className="mt-6 sm:mt-8">
                <DynamicDashboard 
                  policies={normalizedPolicies}
                  viewMode={user?.role === 'administrador' ? 'admin' : 'client'}
                  onSectionChange={setActiveSection}
                />
              </div>
            </div>
          )}
          
          {/* Other Content */}
          {activeSection !== 'dashboard' && (
            <ContentRenderer
              activeSection={activeSection}
              searchTerm={searchTerm}
              filterType={filterType}
              allPolicies={normalizedPolicies}
              extractedPolicies={normalizedPolicies}
              allUsers={persistedUsers}
              usersLoading={usersLoading}
              onPolicySelect={handlePolicySelect}
              onPolicyUpdate={handlePolicyUpdate}
              onPolicyDelete={handleDeletePolicy}
              onPolicyDownload={downloadPersistedPDF}
              onPolicyExtracted={handlePolicyExtracted}
              onUploadComplete={handleUploadComplete}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onSectionChange={setActiveSection}
              uploadViewState={uploadViewState}
            />
          )}
        </div>

        <PolicyDetailsModal 
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          policy={selectedPolicy}
          onDelete={handleDeletePolicy}
          onUpdate={refreshPolicies}
        />

        {/* Botão de teste para toasts com progresso */}
      </main>
      </div>
    </SidebarProvider>
  );
}
