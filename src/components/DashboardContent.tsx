
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

  // ✅ Usar APENAS as apólices persistidas
  const allPolicies = persistedPolicies;

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
    console.log('🚀 handlePolicyExtracted: Nova apólice extraída:', policy.name);
    
    try {
      // ✅ Refresh imediato das apólices persistidas
      console.log('🔄 Executando refresh das apólices persistidas');
      await refreshPolicies();
      
      console.log('✅ Refresh concluído - atualizando UI');
      
      // ✅ Toast de sucesso
      toast({
        title: "✅ Apólice Adicionada",
        description: `${policy.name || 'Nova apólice'} foi processada e salva com sucesso`,
      });
      
    } catch (error) {
      console.error('❌ Erro no handlePolicyExtracted:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar a lista de apólices",
        variant: "destructive",
      });
    }
  };

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handlePolicyUpdate = async (updatedPolicy: any) => {
    console.log('📝 Atualizando apólice:', updatedPolicy.id);
    const success = await updatePersistedPolicy(updatedPolicy.id, updatedPolicy);
    if (success) {
      await refreshPolicies();
      toast({
        title: "✅ Apólice Atualizada",
        description: "As alterações foram salvas com sucesso",
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    console.log('🗑️ Deletando apólice:', policyId);
    const success = await deletePersistedPolicy(policyId);
    if (success) {
      await refreshPolicies();
      toast({
        title: "✅ Apólice Deletada",
        description: "A apólice foi removida com sucesso",
      });
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

  // ✅ Normalizar apenas as apólices persistidas
  const normalizedPolicies = allPolicies.map(policy => ({
    ...policy,
    installments: policy.installments
  }));

  console.log(`🔍 DashboardContent: Total de apólices (persistidas): ${allPolicies.length}`);

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
