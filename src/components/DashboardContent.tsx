import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navbar } from '@/components/Navbar';
import { WelcomeSection } from '@/components/WelcomeSection';
import { ContentRenderer } from '@/components/ContentRenderer';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { usePersistedUsers } from '@/hooks/usePersistedUsers';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  createExtendedInstallments,
  filterOverdueInstallments,
  calculateDuingNext30Days
} from '@/utils/installmentUtils';

export function DashboardContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [extractedPolicies, setExtractedPolicies] = useState<ParsedPolicyData[]>([]);
  const [activeSection, setActiveSection] = useState('home');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Hook para persistência de apólices
  const { 
    policies: persistedPolicies, 
    addPolicy: addPersistedPolicy, 
    deletePolicy: deletePersistedPolicy,
    updatePolicy: updatePersistedPolicy,
    downloadPDF: downloadPersistedPDF,
    hasPersistedData,
    refreshPolicies 
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

  const handlePolicyExtracted = async (policy: any) => {
    console.log('🚀 handlePolicyExtracted CHAMADO para:', policy.name || policy.segurado);
    
    const newPolicy: ParsedPolicyData = {
      ...policy,
      id: policy.id || `policy-${Date.now()}`,
      status: policy.status || 'vigente',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral',
      coverage: policy.coverage || ['Cobertura Básica', 'Responsabilidade Civil'],
      monthlyAmount: policy.monthlyAmount || (parseFloat(policy.premium) / 12) || 0,
      premium: policy.premium || 0,
      deductible: policy.deductible || Math.floor(Math.random() * 5000) + 1000,
      limits: policy.limits || 'R$ 100.000 por sinistro',
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

    console.log('✅ Nova apólice processada:', newPolicy.name);
    
    // Adicionar imediatamente ao estado local
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    // Recarregar as apólices persistidas para mostrar a nova apólice
    setTimeout(() => {
      console.log('🔄 Recarregando apólices persistidas...');
      refreshPolicies();
    }, 2000);
    
    toast({
      title: "📄 Apólice Processada",
      description: `${newPolicy.name} foi adicionada ao dashboard`,
    });
  };

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

  const handleClientRegister = async (client: any) => {
    await addUser(client);
    // O toast já é mostrado no hook usePersistedUsers
  };

  // Normalizar dados das apólices para garantir compatibilidade com todos os componentes
  const normalizedPolicies = allPolicies.map(policy => ({
    ...policy,
    installments: policy.installments || []
  }));

  console.log(`🔍 DashboardContent: Total de apólices (incluindo persistidas): ${allPolicies.length}`);
  console.log(`📊 Apólices persistidas: ${persistedPolicies.length}, Extraídas: ${extractedPolicies.length}`);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar onSectionChange={setActiveSection} activeSection={activeSection} />
        <SidebarInset>
          <Navbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            notificationCount={enhancedDashboardStats.duingNext30Days}
            policies={normalizedPolicies}
          />

          <div className="flex-1">
            <WelcomeSection />
            
            <div id="dashboard-content" className="dashboard-content">
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
                onClientRegister={handleClientRegister}
                onSectionChange={setActiveSection}
              />
            </div>
          </div>

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
}
