
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
import { RegionalMetrics } from './dashboard/RegionalMetrics';
import { ExportDashboard } from './ExportDashboard';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyData } from './charts/chartData';
import { MonthlyProjections } from '@/components/MonthlyProjections';

interface ContentRendererProps {
  activeSection: string;
  searchTerm: string;
  filterType: string;
  allPolicies: ParsedPolicyData[];
  extractedPolicies: ParsedPolicyData[];
  allUsers: any[];
  usersLoading?: boolean;
  onPolicySelect: (policy: any) => void;
  onPolicyUpdate: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicyDownload?: (policyId: string, policyName: string) => void;
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
  usersLoading = false,
  onPolicySelect,
  onPolicyUpdate,
  onPolicyDelete,
  onPolicyDownload,
  onPolicyExtracted,
  onUserUpdate,
  onUserDelete,
  onClientRegister,
  onSectionChange
}: ContentRendererProps) {
  const { user } = useAuth();

  // Convert ParsedPolicyData to PolicyData format for ChartsSection
  const convertToChartData = (policies: ParsedPolicyData[]): PolicyData[] => {
    return policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      type: policy.type,
      insurer: policy.insurer,
      premium: policy.premium,
      monthlyAmount: policy.monthlyAmount,
      startDate: policy.startDate,
      endDate: policy.endDate,
      policyNumber: policy.policyNumber,
      paymentFrequency: policy.paymentFrequency.toLowerCase() as 'mensal' | 'anual' | 'semestral' | 'trimestral',
      documento_tipo: policy.documento_tipo,
      documento: policy.documento,
      installments: Array.isArray(policy.installments) 
        ? policy.installments.map(inst => ({
            numero: inst.numero,
            valor: inst.valor,
            data: inst.data,
            status: inst.status
          }))
        : []
    }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        if (user?.role === 'administrador') {
          return (
            <div className="p-6">
              <AdminDashboardNew 
                policies={extractedPolicies}
                allUsers={allUsers}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <DynamicDashboard 
              policies={extractedPolicies}
              viewMode="client"
              onSectionChange={onSectionChange}
            />
          </div>
        );

      case 'policies':
        return (
          <div className="p-6">
            <EnhancedPolicyViewer 
              policies={extractedPolicies}
              onPolicySelect={onPolicySelect}
              onPolicyEdit={onPolicyUpdate}
              onPolicyDelete={onPolicyDelete}
              onPolicyDownload={onPolicyDownload}
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

      case 'users':
        if (user?.role === 'administrador') {
          return (
            <div className="p-6">
              <UserManagement 
                users={allUsers}
                onUserUpdate={onUserUpdate}
                onUserDelete={onUserDelete}
                isLoading={usersLoading}
              />
              <div className="mt-8">
                <ClientRegister onClientRegister={onClientRegister} />
              </div>
            </div>
          );
        }
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

      case 'projections':
        return (
          <MonthlyProjections policies={allPolicies} />
        );

      default:
        return (
          <div className="p-6">
            <DynamicDashboard 
              policies={extractedPolicies}
              viewMode={user?.role === 'administrador' ? 'admin' : 'client'}
              onSectionChange={onSectionChange}
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {renderContent()}
    </div>
  );
}
