
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navbar } from '@/components/Navbar';
import { WelcomeSection } from '@/components/WelcomeSection';
import { ContentRenderer } from '@/components/ContentRenderer';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';
import { useToast } from '@/hooks/use-toast';

export function DashboardContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [extractedPolicies, setExtractedPolicies] = useState([]);
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();

  const handlePolicyExtracted = (policy: any) => {
    console.log('Nova apólice extraída:', policy);
    
    const newPolicy = {
      ...policy,
      status: 'active',
      entity: user?.company || 'Não informado',
      category: policy.type === 'auto' ? 'Veicular' : 
               policy.type === 'vida' ? 'Pessoal' : 
               policy.type === 'saude' ? 'Saúde' : 'Geral',
      coverage: ['Cobertura Básica', 'Responsabilidade Civil'],
      monthlyAmount: parseFloat(policy.premium) / 12,
      deductible: Math.floor(Math.random() * 5000) + 1000,
      limits: 'R$ 100.000 por sinistro'
    };
    
    setExtractedPolicies(prev => [...prev, newPolicy]);
    
    toast({
      title: "Apólice Adicionada",
      description: `${policy.name} foi adicionada ao sistema`,
    });
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

  const mockPolicies = [
    {
      id: '1',
      name: 'Seguro Auto Civic',
      type: 'auto',
      insurer: 'Porto Seguro',
      premium: 14400,
      monthlyAmount: 1200,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      policyNumber: 'PS-2024-001234',
      category: 'Veicular',
      entity: 'Pessoa Física',
      coverage: ['Cobertura Compreensiva', 'Responsabilidade Civil', 'Danos Materiais'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 2500,
      limits: 'R$ 150.000 por sinistro'
    },
    {
      id: '2',
      name: 'Seguro Residencial Plus',
      type: 'patrimonial',
      insurer: 'Mapfre',
      premium: 10206,
      monthlyAmount: 850.50,
      status: 'expiring',
      startDate: '2023-08-20',
      endDate: '2024-08-20',
      policyNumber: 'MF-2023-005678',
      category: 'Imóvel',
      entity: 'Pessoa Física',
      coverage: ['Incêndio', 'Roubo', 'Danos Elétricos'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 1500,
      limits: 'R$ 200.000 por sinistro'
    }
  ];

  const allPolicies = [...mockPolicies, ...extractedPolicies];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar onSectionChange={setActiveSection} activeSection={activeSection} />
        <SidebarInset>
          <Navbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            notificationCount={allPolicies.filter(p => new Date(p.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
          />

          <div className="flex-1 space-y-6 p-6">
            <WelcomeSection />
            
            <ContentRenderer
              activeSection={activeSection}
              searchTerm={searchTerm}
              filterType={filterType}
              allPolicies={allPolicies}
              extractedPolicies={extractedPolicies}
              onPolicySelect={handlePolicySelect}
              onPolicyUpdate={handlePolicyUpdate}
              onPolicyDelete={handleDeletePolicy}
              onPolicyExtracted={handlePolicyExtracted}
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
