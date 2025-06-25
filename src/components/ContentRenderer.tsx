import { PDFUpload } from '@/components/PDFUpload';
import { EnhancedPDFUpload } from '@/components/EnhancedPDFUpload';
import { PolicyViewer } from '@/components/PolicyViewer';
import { UserManagement } from '@/components/UserManagement';
import { ClientRegister } from '@/components/ClientRegister';
import { ContactSection } from '@/components/ContactSection';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { PotentialSavings } from '@/components/PotentialSavings';

interface ContentRendererProps {
  activeSection: string;
  searchTerm: string;
  filterType: string;
  allPolicies: any[];
  extractedPolicies: any[];
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

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="p-6">
            <EnhancedDashboard policies={allPolicies} />
          </div>
        );

      case 'upload':
        return (
          <div className="p-6">
            <EnhancedPDFUpload onPolicyExtracted={onPolicyExtracted} />
          </div>
        );

      case 'policies':
        return (
          <div className="p-6">
            <PolicyViewer
              policies={extractedPolicies}
              onPolicySelect={onPolicySelect}
              onPolicyEdit={onPolicyUpdate}
              onPolicyDelete={onPolicyDelete}
            />
          </div>
        );

      case 'users':
        return (
          <div className="p-6">
            <UserManagement
              users={allUsers}
              onUserUpdate={onUserUpdate}
              onUserDelete={onUserDelete}
            />
          </div>
        );

      case 'register':
        return (
          <div className="p-6">
            <ClientRegister onClientRegister={onClientRegister} />
          </div>
        );
      
      case 'potential-savings':
        return (
          <div className="p-6">
            <PotentialSavings policies={allPolicies} />
          </div>
        );

      case 'contact':
        return (
          <div className="p-6">
            <ContactSection />
          </div>
        );

      default:
        return (
          <div className="p-6">
            <h2>Seção não encontrada</h2>
            <p>Selecione uma opção no menu lateral.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {renderContent()}
    </div>
  );
}
