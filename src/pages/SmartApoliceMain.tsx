import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SmartApoliceSidebar } from '@/components/smartapolice/SmartApoliceSidebar';
import { SmartApoliceNavbar } from '@/components/smartapolice/SmartApoliceNavbar';
import { SmartApoliceContentRenderer } from '@/components/smartapolice/SmartApoliceContentRenderer';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

export function SmartApoliceMain() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('buscar');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [apolices, setApolices] = useState([]);

  // Verificar se o usuário tem acesso ao SmartApolice
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso Negado",
        description: "Você precisa estar logado para acessar o SmartApolice",
        variant: "destructive",
      });
      return;
    }

    // Log de acesso
    console.log('🏁 SmartApolice acessado por:', user.name, '- Role:', user.role);
  }, [user, toast]);

  const handlePolicyImport = (policy: any) => {
    console.log('📄 Nova apólice importada:', policy);
    setApolices(prev => [policy, ...prev]);
    
    toast({
      title: "✅ Apólice Importada",
      description: `${policy.numero_apolice || 'Nova apólice'} foi processada com sucesso`,
    });
  };

  const handlePolicyUpdate = (updatedPolicy: any) => {
    setApolices(prev => 
      prev.map(policy => 
        policy.id === updatedPolicy.id ? updatedPolicy : policy
      )
    );
    
    toast({
      title: "✅ Apólice Atualizada",
      description: "As informações foram salvas com sucesso",
    });
  };

  const handlePolicyDelete = (policyId: string) => {
    setApolices(prev => prev.filter(policy => policy.id !== policyId));
    
    toast({
      title: "✅ Apólice Removida",
      description: "A apólice foi removida com sucesso",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">SmartApolice</h1>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <SmartApoliceSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <SidebarInset>
          <SmartApoliceNavbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            apolicesCount={apolices.length}
          />

          <div className="flex-1 p-6">
            <SmartApoliceContentRenderer
              activeSection={activeSection}
              searchTerm={searchTerm}
              apolices={apolices}
              selectedPolicy={selectedPolicy}
              onPolicyImport={handlePolicyImport}
              onPolicyUpdate={handlePolicyUpdate}
              onPolicyDelete={handlePolicyDelete}
              onPolicySelect={setSelectedPolicy}
              onSectionChange={setActiveSection}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}