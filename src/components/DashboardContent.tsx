import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navbar } from '@/components/Navbar';
import { WelcomeSection } from '@/components/WelcomeSection';
import { ContentRenderer } from '@/components/ContentRenderer';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { TourManager } from '@/components/TourManager';
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

  const handlePolicyExtracted = async (policy: any) => {
    console.log('🚀 handlePolicyExtracted CHAMADO!');
    console.log('Nova apólice extraída:', policy);
    
    const newPolicy: ParsedPolicyData = {
      ...policy,
      id: `policy-${Date.now()}`,
      status: 'active',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral',
      coverage: ['Cobertura Básica', ' Responsabilidade Civil'],
      monthlyAmount: policy.monthlyAmount || (parseFloat(policy.premium) / 12) || 0,
      premium: policy.premium || 0,
      deductible: Math.floor(Math.random() * 5000) + 1000,
      limits: 'R$ 100.000 por sinistro',
      installments: Array.isArray(policy.installments) ? policy.installments : 
                   policy.installments ? generateInstallmentsFromNumber(policy.installments, policy.monthlyAmount, policy.startDate) :
                   generateDefaultInstallments(policy.monthlyAmount, policy.startDate),
      totalCoverage: policy.totalCoverage || policy.premium || 0,
      startDate: policy.startDate || new Date().toISOString().split('T')[0],
      endDate: policy.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      documento: policy.documento,
      documento_tipo: policy.documento_tipo,
      insuredName: policy.segurado || policy.insuredName
    };

    console.log('✅ Adicionando apólice ao dashboard local primeiro');
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    // CORREÇÃO: Chamar persistência DIRETAMENTE aqui
    if (user?.id && policy.file) {
      console.log('💾 Chamando persistência diretamente do handlePolicyExtracted');
      try {
        const { PolicyPersistenceService } = await import('@/services/policyPersistenceService');
        const success = await PolicyPersistenceService.savePolicyComplete(policy.file, newPolicy, user.id);
        console.log(`✅ Persistência direta resultado: ${success}`);
      } catch (error) {
        console.error('❌ Erro na persistência direta:', error);
      }
    } else {
      console.warn('⚠️ Persistência pulada - userId ou file não disponível:', {
        userId: user?.id,
        hasFile: !!policy.file
      });
    }
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name || 'Nova apólice'} foi processada e salva`,
    });
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
    // Tentar deletar do banco primeiro (se for persistida)
    const isPersistedPolicy = persistedPolicies.some(p => p.id === policyId);
    
    if (isPersistedPolicy) {
      await deletePersistedPolicy(policyId);
      // Toast já mostrado no hook
    } else {
      // Deletar apenas do estado local (apólices extraídas)
      const policyToDelete = extractedPolicies.find(p => p.id === policyId);
      if (policyToDelete) {
        setExtractedPolicies(prev => prev.filter(p => p.id !== policyId));
        
        toast({
          title: "Apólice Removida",
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
  // IMPORTANTE: Usar allPolicies (que inclui persistidas) e não apenas extractedPolicies
  const normalizedPolicies = allPolicies.map(policy => ({
    ...policy,
    // Garantir que installments seja sempre um número para evitar erros nos componentes filhos
    installments: typeof policy.installments === 'number' ? policy.installments : 
                 Array.isArray(policy.installments) ? policy.installments.length : 12
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
          
          {/* Tour Manager - aparece automaticamente para novos usuários */}
          <TourManager />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
