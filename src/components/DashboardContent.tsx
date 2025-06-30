import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navbar } from '@/components/Navbar';
import { WelcomeSection } from '@/components/WelcomeSection';
import { ContentRenderer } from '@/components/ContentRenderer';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/useDashboardData';
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
  const [allUsers, setAllUsers] = useState([
    {
      id: '1',
      name: 'João Silva',
      email: 'admin@empresa.com',
      role: 'administrador',
      company: 'Empresa ABC',
      phone: '(11) 99999-9999',
      status: 'active'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'cliente@exemplo.com',
      role: 'cliente',
      company: 'Consultoria XYZ',
      phone: '(11) 88888-8888',
      status: 'active'
    }
  ]);
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();

  // Usar o hook de dashboard data
  const { dashboardData } = useDashboardData(extractedPolicies);

  // Calcular estatísticas de parcelas
  const allInstallments = createExtendedInstallments(extractedPolicies);
  const overdueInstallments = filterOverdueInstallments(allInstallments);
  const duingNext30Days = calculateDuingNext30Days(allInstallments);

  // Criar estatísticas atualizadas para o dashboard
  const enhancedDashboardStats = {
    ...dashboardData,
    overdueInstallments: overdueInstallments.length,
    duingNext30Days: duingNext30Days
  };

  const handlePolicyExtracted = (policy: any) => {
    console.log('Nova apólice extraída com dados do N8N:', policy);
    
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
      // Manter installments como array se já for, senão gerar array de parcelas
      installments: Array.isArray(policy.installments) ? policy.installments : 
                   policy.installments ? generateInstallmentsFromNumber(policy.installments, policy.monthlyAmount, policy.startDate) :
                   generateDefaultInstallments(policy.monthlyAmount, policy.startDate),
      totalCoverage: policy.totalCoverage || policy.premium || 0,
      startDate: policy.startDate || new Date().toISOString().split('T')[0],
      endDate: policy.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // Preservar dados de documento do N8N - GARANTIR QUE SEJAM MANTIDOS
      documento: policy.documento,
      documento_tipo: policy.documento_tipo,
      segurado: policy.segurado,
      insuredName: policy.segurado || policy.insuredName
    };

    console.log('Política processada com dados N8N:', {
      documento: newPolicy.documento,
      documento_tipo: newPolicy.documento_tipo,
      segurado: newPolicy.segurado
    });
    
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name || 'Nova apólice'} foi adicionada ao sistema`,
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

  const handleUserUpdate = (updatedUser: any) => {
    setAllUsers(prev => 
      prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    
    toast({
      title: "Usuário Atualizado",
      description: "As informações foram salvas com sucesso",
    });
  };

  const handleUserDelete = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleClientRegister = (client: any) => {
    setAllUsers(prev => [...prev, client]);
  };

  // Normalizar dados das apólices para garantir compatibilidade com todos os componentes
  const normalizedPolicies = extractedPolicies.map(policy => ({
    ...policy,
    // Garantir que installments seja sempre um número para evitar erros nos componentes filhos
    installments: typeof policy.installments === 'number' ? policy.installments : 
                 Array.isArray(policy.installments) ? policy.installments.length : 12
  }));

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
            
            <ContentRenderer
              activeSection={activeSection}
              searchTerm={searchTerm}
              filterType={filterType}
              allPolicies={normalizedPolicies}
              extractedPolicies={normalizedPolicies}
              allUsers={allUsers}
              onPolicySelect={handlePolicySelect}
              onPolicyUpdate={handlePolicyUpdate}
              onPolicyDelete={handleDeletePolicy}
              onPolicyExtracted={handlePolicyExtracted}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onClientRegister={handleClientRegister}
              onSectionChange={setActiveSection}
            />
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
