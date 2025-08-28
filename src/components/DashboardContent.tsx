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

  // IMPORTANTE: Usar APENAS as apólices persistidas (do banco)
  const allPolicies = persistedPolicies;

  // Usar o hook de dashboard data com as apólices persistidas
  const { dashboardData } = useDashboardData(allPolicies);

  // Calcular estatísticas de parcelas
  const allInstallments = createExtendedInstallments(allPolicies);
  const overdueInstallments = filterOverdueInstallments(allInstallments);
  const duingNext30Days = calculateDuingNext30Days(allInstallments);

  const enhancedDashboardStats = {
    ...dashboardData,
    overdueInstallments: overdueInstallments.length,
    duingNext30Days: duingNext30Days
  };

  // FUNÇÃO CRÍTICA CORRIGIDA: Garantir persistência imediata
  const handlePolicyExtracted = async (policy: ParsedPolicyData) => {
    console.log('🚀 INICIANDO handlePolicyExtracted com persistência forçada!');
    console.log('📋 Dados da nova apólice:', {
      id: policy.id,
      name: policy.name,
      hasFile: !!policy.file,
      userId: user?.id
    });
    
    if (!user?.id) {
      console.error('❌ CRÍTICO: Usuário não autenticado');
      toast({
        title: "❌ Erro de Autenticação",
        description: "Faça login para salvar apólices",
        variant: "destructive",
      });
      return;
    }

    // Garantir ID único se não existir
    if (!policy.id) {
      policy.id = crypto.randomUUID();
    }

    // Completar dados obrigatórios
    const completePolicy: ParsedPolicyData = {
      ...policy,
      status: policy.status || 'vigente',
      entity: user.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral',
      coverage: policy.coberturas?.map((c: any) => c.descricao) || ['Cobertura Básica'],
      monthlyAmount: policy.monthlyAmount || (policy.premium ? policy.premium / 12 : 100),
      premium: policy.premium || 1200,
      deductible: policy.deductible || 1000,
      installments: policy.installments || generateDefaultInstallments(policy.monthlyAmount || 100, policy.startDate),
      totalCoverage: policy.totalCoverage || policy.premium || 1200,
      startDate: policy.startDate || new Date().toISOString().split('T')[0],
      endDate: policy.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: policy.expirationDate || policy.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyStatus: 'vigente',
      extractedAt: new Date().toISOString()
    };

    console.log('💾 CHAMANDO addPersistedPolicy para persistência FORÇADA...');
    
    try {
      const success = await addPersistedPolicy(completePolicy, completePolicy.file);
      
      if (success) {
        console.log('✅ PERSISTÊNCIA REALIZADA COM SUCESSO!');
        
        toast({
          title: "📄 Apólice Salva Permanentemente",
          description: `${completePolicy.name} foi processada e salva no banco de dados`,
        });
        
        // Forçar recarregamento dos dados
        setTimeout(() => {
          refreshPolicies();
        }, 2000);
        
      } else {
        console.error('❌ FALHA NA PERSISTÊNCIA');
        throw new Error('Falha ao salvar apólice no banco');
      }
      
    } catch (error) {
      console.error('❌ Erro crítico na persistência:', error);
      
      toast({
        title: "❌ Erro Crítico",
        description: `Não foi possível salvar ${completePolicy.name} permanentemente`,
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para gerar parcelas padrão
  const generateDefaultInstallments = (monthlyAmount: number, startDate?: string) => {
    const installments = [];
    const baseDate = new Date(startDate || new Date());
    
    for (let i = 0; i < 12; i++) {
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

  const handlePolicySelect = (policy: any) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handlePolicyUpdate = async (updatedPolicy: any) => {
    const success = await updatePersistedPolicy(updatedPolicy.id, updatedPolicy);
    if (!success) return;
  };

  const handleDeletePolicy = async (policyId: string) => {
    console.log(`🗑️ Tentando deletar apólice: ${policyId}`);
    const success = await deletePersistedPolicy(policyId);
    if (!success) {
      console.error('❌ Falha na deleção da apólice');
    }
  };

  const handleUserUpdate = async (updatedUser: any) => {
    await updateUser(updatedUser.id, updatedUser);
  };

  const handleUserDelete = async (userId: string) => {
    await deleteUser(userId);
  };

  const handleClientRegister = async (client: any) => {
    await addUser(client);
  };

  console.log(`🔍 DashboardContent: Total de apólices persistidas: ${allPolicies.length}`);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar onSectionChange={setActiveSection} activeSection={activeSection} />
        <SidebarInset>
          <Navbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            notificationCount={enhancedDashboardStats.duingNext30Days}
            policies={allPolicies}
          />

          <div className="flex-1">
            <WelcomeSection />
            
            <div id="dashboard-content" className="dashboard-content">
              <ContentRenderer
                activeSection={activeSection}
                searchTerm={searchTerm}
                filterType={filterType}
                allPolicies={allPolicies}
                extractedPolicies={allPolicies}
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
