
import React, { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Navbar } from '@/components/Navbar';
import { ContentRenderer } from '@/components/ContentRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { usePersistedUsers } from '@/hooks/usePersistedUsers';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

function AppContent() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { policies, addPolicy, deletePolicy, updatePolicy, downloadPDF } = usePersistedPolicies();
  const { users, isLoading: usersLoading, updateUser, deleteUser, addUser } = usePersistedUsers();

  if (!user) {
    return <AuthPage />;
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handlePolicySelect = (policy: any) => {
    console.log('Policy selected:', policy);
  };

  const handlePolicyUpdate = async (policy: any) => {
    if (policy.id) {
      await updatePolicy(policy.id, policy);
    }
  };

  const handlePolicyDelete = async (policyId: string) => {
    await deletePolicy(policyId);
  };

  const handlePolicyDownload = async (policyId: string, policyName: string) => {
    await downloadPDF(policyId, policyName);
  };

  const handlePolicyExtracted = (policy: any) => {
    addPolicy(policy);
  };

  const handleUserUpdate = async (userData: any) => {
    await updateUser(userData.id, userData);
  };

  const handleUserDelete = async (userId: string) => {
    await deleteUser(userId);
  };

  const handleClientRegister = async (clientData: any) => {
    await addUser(clientData);
  };

  const expiringPolicies = policies.filter(policy => {
    const endDate = new Date(policy.endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return endDate <= thirtyDaysFromNow;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          onSectionChange={handleSectionChange}
          activeSection={activeSection}
        />
        
        <div className="flex-1 flex flex-col">
          <Navbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            notificationCount={expiringPolicies.length}
            policies={policies}
          />
          
          <main className="flex-1 p-6">
            <ContentRenderer 
              activeSection={activeSection}
              searchTerm={searchTerm}
              filterType={filterType}
              allPolicies={policies}
              extractedPolicies={policies}
              allUsers={users}
              usersLoading={usersLoading}
              onPolicySelect={handlePolicySelect}
              onPolicyUpdate={handlePolicyUpdate}
              onPolicyDelete={handlePolicyDelete}
              onPolicyDownload={handlePolicyDownload}
              onPolicyExtracted={handlePolicyExtracted}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onClientRegister={handleClientRegister}
              onSectionChange={handleSectionChange}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default Index;
