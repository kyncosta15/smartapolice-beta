import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicDashboard } from './DynamicDashboard';
import { AdminDashboardNew } from './AdminDashboardNew';
import { EnhancedPDFUpload } from './EnhancedPDFUpload';
import { EnhancedPolicyViewer } from './EnhancedPolicyViewer';
import { VidasBeneficiarios } from './VidasBeneficiarios';
import { ClientsList } from './ClientsList';
import { ContactSection } from './ContactSection';
import { OptimizedSettings } from './OptimizedSettings';
import { ChartsSection } from './ChartsSection';
import { InstallmentsDashboard } from './InstallmentsDashboard';
import { PolicyInstallmentsCard } from './installments/PolicyInstallmentsCard';
import { RegionalMetrics } from './dashboard/RegionalMetrics';
import { ExportDashboard } from './ExportDashboard';
import { VeiculosManagement } from './VeiculosManagement';
import { GestaoFrotas } from './GestaoFrotas';
import { SinistrosManagement } from './SinistrosManagement';
import { N8NDataTester } from './N8NDataTester';
import { UserProfile } from './UserProfile';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyData } from './charts/chartData';

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
      // Fix installments type compatibility
      installments: Array.isArray(policy.installments) 
        ? policy.installments.map(inst => ({
            numero: inst.numero,
            valor: inst.valor,
            data: inst.data,
            status: inst.status
          }))
        : [] // Default to empty array if installments is a number
    }));
  };

  // Para administradores, sempre mostrar dashboard administrativo na home e relatórios
  if (user?.role === 'administrador' && (activeSection === 'home' || activeSection === 'reports')) {
    return (
      <div className="p-6">
        <AdminDashboardNew 
          policies={extractedPolicies}
          allUsers={allUsers}
        />
      </div>
    );
  }

  // Para clientes, mostrar dashboard normal na home
  if (activeSection === 'home') {
    return (
      <div className="p-6">
        <DynamicDashboard 
          policies={extractedPolicies}
          viewMode="client"
          onSectionChange={onSectionChange}
        />
      </div>
    );
  }

  // Admin-only sections check
  if (['clients', 'vidas-beneficiarios'].includes(activeSection) && 
      user.role !== 'admin' && user.role !== 'administrador' && user.role !== 'rh' && user.role !== 'corretora_admin' && user.role !== 'gestor_rh') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta seção.
          </p>
        </div>
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

    case 'clients':
      return (
        <div className="p-6">
          <ClientsList />
        </div>
      );

    case 'users':
      return (
        <div className="p-6">
          <VidasBeneficiarios allPolicies={allPolicies} />
        </div>
      );

    case 'contatos':
      return (
        <div className="p-6">
          <ContactSection />
        </div>
      );

    case 'reports':
      return (
        <div className="p-6">
          <ExportDashboard />
        </div>
      );

    case 'settings':
      return (
        <div className="p-6">
          <OptimizedSettings onBackToHome={() => onSectionChange('home')} />
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

    case 'claims':
      return (
        <div className="p-6">
          <SinistrosManagement 
            allPolicies={allPolicies}
            onPolicyUpdate={onPolicyUpdate}
            onPolicySelect={onPolicySelect}
          />
        </div>
      );

    case 'frotas':
      return (
        <GestaoFrotas />
      );

    case 'veiculos':
      return (
        <div className="p-6">
          <VeiculosManagement 
            allPolicies={allPolicies}
            onPolicyUpdate={onPolicyUpdate}
            onPolicySelect={onPolicySelect}
          />
        </div>
      );

    case 'regional-metrics':
      return (
        <div className="p-6">
          <RegionalMetrics />
        </div>
      );

    case 'n8n-data-tester':
      return (
        <div className="p-6">
          <N8NDataTester />
        </div>
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
}