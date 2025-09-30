import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';
import { 
  createExtendedInstallments,
  filterOverdueInstallments,
  calculateDuingNext30Days
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [extractedPolicies, setExtractedPolicies] = useState<ParsedPolicyData[]>([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { progressToast } = useProgressToast();

  // Hook para persistência de apólices
  const { 
    policies: persistedPolicies, 
    addPolicy: addPersistedPolicy, 
    deletePolicy: deletePersistedPolicy,
    updatePolicy: updatePersistedPolicy,
    downloadPDF: downloadPersistedPDF,
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

  // Combinar apólices extraídas e persistidas, evitando duplicatas
  const allPolicies = [...extractedPolicies, ...persistedPolicies.filter(
    pp => !extractedPolicies.some(ep => ep.id === pp.id)
  )];

  // Usar o hook de dashboard data com todas as apólices
  const { dashboardData } = useDashboardData(allPolicies);

  // Calcular estatísticas de parcelas com TODAS as apólices (incluindo persistidas)
  const allInstallments = createExtendedInstallments(allPolicies);
  const overdueInstallments = filterOverdueInstallments(allInstallments);
  const duingNext30Days = calculateDuingNext30Days(allInstallments);

  // Criar estatísticas atualizadas para o dashboard
  const enhancedDashboardStats = {
    ...dashboardData,
    overdueInstallments: overdueInstallments.length,
    duingNext30Days: duingNext30Days
  };

  // Navigation items - role-based visibility per specifications
  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const navigation = (['administrador', 'admin', 'corretora_admin'].includes(user?.role || '')) ? adminNavigation : clientNavigation;

  const handlePolicyExtracted = async (policy: any) => {
    console.log('🚀 handlePolicyExtracted CHAMADO para persistência!');
    console.log('Nova apólice extraída:', policy);
    
    // CORREÇÃO: Garantir ID único e evitar duplicação
    const policyId = policy.id || `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newPolicy: ParsedPolicyData = {
      ...policy,
      id: policyId,
      status: policy.status || 'vigente',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 
               policy.type === 'empresarial' ? 'Empresarial' : 'Geral',
      coverage: policy.coberturas?.map((c: any) => {
        // Usar renderização segura para evitar objetos React
        if (typeof c === 'string') return c;
        if (typeof c === 'object' && c !== null && c.descricao) {
          return typeof c.descricao === 'string' ? c.descricao : 'Cobertura';
        }
        if (typeof c === 'object' && c !== null) {
          return 'Cobertura';
        }
        return String(c || 'Cobertura Básica');
      }).filter(desc => desc && desc !== 'Não informado') || ['Cobertura Básica'],
      monthlyAmount: policy.monthlyAmount || (parseFloat(policy.premium) / 12) || 0,
      premium: policy.premium || 0,
      deductible: policy.deductible || Math.floor(Math.random() * 5000) + 1000,
      limits: 'R$ 100.000 por sinistro',
      installments: Array.isArray(policy.installments) ? policy.installments : 
                   policy.installments ? generateInstallmentsFromNumber(policy.installments, policy.monthlyAmount, policy.startDate) :
                   generateDefaultInstallments(policy.monthlyAmount, policy.startDate),
      totalCoverage: policy.totalCoverage || policy.premium || 0,
      startDate: policy.startDate || new Date().toISOString().split('T')[0],
      endDate: policy.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      documento: policy.documento,
      documento_tipo: policy.documento_tipo,
      insuredName: policy.segurado || policy.insuredName,
      coberturas: policy.coberturas || []
    };

    console.log('✅ Adicionando apólice ao dashboard local imediatamente');
    
    // CORREÇÃO: Verificar se a apólice já existe antes de adicionar
    setExtractedPolicies(prev => {
      const exists = prev.some(p => p.id === newPolicy.id || 
        (p.policyNumber === newPolicy.policyNumber && p.policyNumber !== 'N/A'));
      
      if (exists) {
        console.log('⚠️ Apólice já existe, não duplicando');
        return prev;
      }
      
      console.log('✅ Nova apólice adicionada ao estado local');
      return [newPolicy, ...prev];
    });
    
    // CORREÇÃO CRÍTICA: Garantir que a persistência seja feita com userId correto
    if (user?.id && policy.file) {
      console.log('💾 INICIANDO persistência IMEDIATA para usuário:', user.id);
      
      try {
        const { PolicyPersistenceService } = await import('@/services/policyPersistenceService');
        const success = await PolicyPersistenceService.savePolicyComplete(policy.file, newPolicy, user.id);
        
        if (success) {
          console.log('✅ PERSISTÊNCIA REALIZADA COM SUCESSO!');
          
          // Recarregar apólices persistidas após um breve delay
          setTimeout(() => {
            addPersistedPolicy(newPolicy);
          }, 2000);
          
          toast({
            title: "📄 Apólice Salva",
            description: `${policy.name || 'Nova apólice'} foi processada e salva no banco de dados`,
          });
        } else {
          console.error('❌ FALHA NA PERSISTÊNCIA');
          toast({
            title: "⚠️ Aviso",
            description: `Apólice processada mas pode não ter sido salva. Verifique após fazer logout/login.`,
            variant: "destructive",
          });
        }
        
      } catch (error) {
        console.error('❌ Erro crítico na persistência:', error);
        toast({
          title: "❌ Erro na Persistência",
          description: "A apólice foi processada mas pode não ter sido salva permanentemente",
          variant: "destructive",
        });
      }
    } else {
      console.warn('⚠️ Persistência pulada - dados insuficientes:', {
        userId: user?.id,
        hasFile: !!policy.file
      });
      
      toast({
        title: "✅ Apólice Processada",
        description: "Apólice adicionada ao dashboard (persistência pode ser limitada sem arquivo)",
      });
    }
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
      <div className="min-h-screen flex w-full bg-gray-50">
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
                  totalMonthlyCost: enhancedDashboardStats.totalMonthlyCost || 0,
                  totalInsuredValue: enhancedDashboardStats.totalInsuredValue || 0,
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
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onSectionChange={setActiveSection}
            />
          )}
        </div>

        <PolicyDetailsModal 
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          policy={selectedPolicy}
          onDelete={handleDeletePolicy}
        />

        {/* Botão de teste para toasts com progresso */}
      </main>
      </div>
    </SidebarProvider>
  );
}
