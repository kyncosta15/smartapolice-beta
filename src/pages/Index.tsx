
import React, { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { Navbar } from '@/components/Navbar';
import { ContentRenderer } from '@/components/ContentRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

function AppContent() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const { policies } = usePersistedPolicies();

  if (!user) {
    return <AuthPage />;
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
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
