import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicDashboard } from './DynamicDashboard';
import { AdminDashboardNew } from './AdminDashboardNew';
import { EnhancedPDFUpload } from './EnhancedPDFUpload';
import { EnhancedPolicyViewer } from './EnhancedPolicyViewer';
import { UserManagement } from './UserManagement';
import { ClientRegister } from './ClientRegister';
import { ContactSection } from './ContactSection';
import { OptimizedSettings } from './OptimizedSettings';
import { ChartsSection } from './ChartsSection';
import { InstallmentsDashboard } from './InstallmentsDashboard';
import { PolicyInstallmentsCard } from './installments/PolicyInstallmentsCard';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface ContentRendererProps {
  activeSection: string;
  searchTerm: string;
  filterType: string;
  allPolicies: ParsedPolicyData[];
  extractedPolicies: ParsedPolicyData[];
  allUsers: any[];
  onPolicySelect: (policy: any) => void;
  onPolicyUpdate: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicyExtracted: (policy: any) => void;
  onUserUpdate: (user: any) => void;
  onUserDelete: (userId: string) => void;
  onClientRegister: (client: any) => void;
  onSectionChange: (section: string) => void;
}

export function ContentRenderer({
  activeSection,
  searchTerm,
  filterType,
  allPolicies,
  extractedPolicies,
  allUsers,
  onPolicySelect,
  onPolicyUpdate,
  onPolicyDelete,
  onPolicyExtracted,
  onUserUpdate,
  onUserDelete,
  onClientRegister,
  onSectionChange
}: ContentRendererProps) {
  const { user } = useAuth();

  // Convert ParsedPolicyData to PolicyData format for ChartsSection
  const convertToChartData = (policies: ParsedPolicyData[]) => {
    return policies.map(policy => ({
      ...policy,
      paymentFrequency: policy.paymentFrequency.toLowerCase() as 'mensal' | 'anual' | 'semestral' | 'trimestral'
    }));
  };

  // Para administradores, mostrar dashboard administrativo na seção de relatórios
  if (user?.role === 'administrador' && activeSection === 'reports') {
    return (
      <AdminDashboardNew 
        policies={extractedPolicies}
        allUsers={allUsers}
      />
    );
  }

  // Para clientes, mostrar dashboard normal na home
  if (activeSection === 'home') {
    return (
      <div className="p-6">
        <DynamicDashboard 
          policies={extractedPolicies}
          viewMode={user?.role === 'administrador' ? 'admin' : 'client'}
        />
      </div>
    );
  }

  switch (activeSection) {
    case 'policies':
      return (
        <div className="p-6">
          <EnhancedPolicyViewer 
            policies={extractedPolicies}
            onPolicySelect={onPolicySelect}
            onPolicyEdit={onPolicyUpdate}
            onPolicyDelete={onPolicyDelete}
            viewMode={user?.role === 'administrador' ? 'admin' : 'client'}
          />
        </div>
      );

    case 'upload':
      return (
        <div className="p-6">
          <EnhancedPDFUpload onPolicyExtracted={onPolicyExtracted} />
        </div>
      );

    case 'clients':
      if (user?.role === 'administrador') {
        return (
          <div className="p-6">
            <UserManagement 
              users={allUsers}
              onUserUpdate={onUserUpdate}
              onUserDelete={onUserDelete}
            />
            <div className="mt-8">
              <ClientRegister onClientRegister={onClientRegister} />
            </div>
          </div>
        );
      }
      return (
        <div className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              Esta seção é disponível apenas para administradores.
            </p>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="p-6">
          <ContactSection />
        </div>
      );

    case 'settings':
      return (
        <div className="p-6">
          <OptimizedSettings />
        </div>
      );

    case 'installments':
      return (
        <div className="p-6">
          <InstallmentsDashboard policies={extractedPolicies} />
          <div className="mt-8 grid gap-6">
            {extractedPolicies.map((policy, index) => (
              <PolicyInstallmentsCard 
                key={policy.id || index}
                policy={policy}
                index={index}
              />
            ))}
          </div>
        </div>
      );

    case 'charts':
      return (
        <div className="p-6">
          <ChartsSection detailed={true} policies={convertToChartData(extractedPolicies)} />
        </div>
      );

    default:
      return (
        <div className="p-6">
          <DynamicDashboard 
            policies={extractedPolicies}
            viewMode={user?.role === 'administrador' ? 'admin' : 'client'}
          />
        </div>
      );
  }
}
