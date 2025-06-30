
import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ContentRenderer } from "@/components/ContentRenderer";
import { ParsedPolicyData } from '@/utils/policyDataParser';

export default function Index() {
  // ✅ Estado global para acumular TODAS as apólices enviadas
  const [allPolicies, setAllPolicies] = useState<ParsedPolicyData[]>([]);
  const [extractedPolicies, setExtractedPolicies] = useState<ParsedPolicyData[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // ✅ Carregar apólices salvas do localStorage na inicialização
  useEffect(() => {
    const savedPolicies = localStorage.getItem('accumulated_policies');
    if (savedPolicies) {
      try {
        const parsedPolicies = JSON.parse(savedPolicies);
        setAllPolicies(parsedPolicies);
        console.log('📋 Apólices carregadas do localStorage:', parsedPolicies.length);
      } catch (error) {
        console.error('❌ Erro ao carregar apólices do localStorage:', error);
      }
    }
  }, []);

  // ✅ Salvar apólices no localStorage sempre que houver mudança
  useEffect(() => {
    if (allPolicies.length > 0) {
      localStorage.setItem('accumulated_policies', JSON.stringify(allPolicies));
      console.log('💾 Apólices salvas no localStorage:', allPolicies.length);
    }
  }, [allPolicies]);

  // ✅ Função para adicionar nova apólice ao estado global acumulativo
  const handleNewUpload = (newPolicy: ParsedPolicyData) => {
    console.log('📤 Adicionando nova apólice ao estado global:', newPolicy.name);
    
    setAllPolicies(prev => {
      // Verificar se a apólice já existe (evitar duplicatas)
      const exists = prev.some(p => p.id === newPolicy.id);
      if (exists) {
        console.log('⚠️ Apólice já existe, não adicionando duplicata');
        return prev;
      }
      
      const updated = [...prev, newPolicy];
      console.log('✅ Total de apólices acumuladas:', updated.length);
      return updated;
    });

    // Também adicionar à lista de extraídas (para visualização individual)
    setExtractedPolicies(prev => {
      const exists = prev.some(p => p.id === newPolicy.id);
      if (!exists) {
        return [...prev, newPolicy];
      }
      return prev;
    });
  };

  const handlePolicySelect = (policy: ParsedPolicyData) => {
    console.log('Apólice selecionada:', policy);
  };

  const handlePolicyUpdate = (updatedPolicy: ParsedPolicyData) => {
    console.log('Apólice atualizada:', updatedPolicy);
    
    // Atualizar no estado global
    setAllPolicies(prev => 
      prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p)
    );
    
    // Atualizar na lista de extraídas
    setExtractedPolicies(prev => 
      prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p)
    );
  };

  const handlePolicyDelete = (policyId: string) => {
    console.log('Deletando apólice:', policyId);
    
    // Remover do estado global
    setAllPolicies(prev => prev.filter(p => p.id !== policyId));
    
    // Remover da lista de extraídas
    setExtractedPolicies(prev => prev.filter(p => p.id !== policyId));
  };

  const handleUserUpdate = (updatedUser: any) => {
    setAllUsers(prev => 
      prev.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
  };

  const handleUserDelete = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleClientRegister = (client: any) => {
    console.log('Cliente registrado:', client);
  };

  // Debug: mostrar contagem atual
  console.log('🔍 Estado atual - Total de apólices:', allPolicies.length);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">
                Smart Apólice Dashboard
              </h1>
              {allPolicies.length > 0 && (
                <div className="ml-auto text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  📊 {allPolicies.length} apólice{allPolicies.length !== 1 ? 's' : ''} acumulada{allPolicies.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </header>
          
          <ContentRenderer
            activeSection={activeSection}
            searchTerm={searchTerm}
            filterType={filterType}
            allPolicies={allPolicies} // ✅ Passando o estado global acumulativo
            extractedPolicies={extractedPolicies}
            allUsers={allUsers}
            onPolicySelect={handlePolicySelect}
            onPolicyUpdate={handlePolicyUpdate}
            onPolicyDelete={handlePolicyDelete}
            onPolicyExtracted={handleNewUpload} // ✅ Função para acumular novas apólices
            onUserUpdate={handleUserUpdate}
            onUserDelete={handleUserDelete}
            onClientRegister={handleClientRegister}
            onSectionChange={setActiveSection}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
