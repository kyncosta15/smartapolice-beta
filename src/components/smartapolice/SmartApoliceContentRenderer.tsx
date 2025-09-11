import { SmartApoliceBuscar } from './sections/SmartApoliceBuscar';
import { SmartApoliceDetalhes } from './sections/SmartApoliceDetalhes';
import { SmartApoliceFinanceiro } from './sections/SmartApoliceFinanceiro';
import { SmartApoliceDocumentos } from './sections/SmartApoliceDocumentos';
import { SmartApoliceRelatorios } from './sections/SmartApoliceRelatorios';
import { SmartApoliceFipe } from './sections/SmartApoliceFipe';
import { SmartApoliceVeiculos } from './sections/SmartApoliceVeiculos';
import { SmartApoliceConfiguracoes } from './sections/SmartApoliceConfiguracoes';

interface SmartApoliceContentRendererProps {
  activeSection: string;
  searchTerm: string;
  apolices: any[];
  selectedPolicy: any;
  onPolicyImport: (policy: any) => void;
  onPolicyUpdate: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicySelect: (policy: any) => void;
  onSectionChange: (section: string) => void;
}

export function SmartApoliceContentRenderer({
  activeSection,
  searchTerm,
  apolices,
  selectedPolicy,
  onPolicyImport,
  onPolicyUpdate,
  onPolicyDelete,
  onPolicySelect,
  onSectionChange
}: SmartApoliceContentRendererProps) {
  
  const renderContent = () => {
    switch (activeSection) {
      case 'buscar':
        return (
          <SmartApoliceBuscar
            searchTerm={searchTerm}
            apolices={apolices}
            onPolicyImport={onPolicyImport}
            onPolicySelect={onPolicySelect}
            onPolicyDelete={onPolicyDelete}
          />
        );
      
      case 'detalhes':
        return (
          <SmartApoliceDetalhes
            selectedPolicy={selectedPolicy}
            onPolicyUpdate={onPolicyUpdate}
            onSectionChange={onSectionChange}
          />
        );
      
      case 'financeiro':
        return (
          <SmartApoliceFinanceiro
            apolices={apolices}
            selectedPolicy={selectedPolicy}
            onPolicyUpdate={onPolicyUpdate}
          />
        );
      
      case 'documentos':
        return (
          <SmartApoliceDocumentos
            selectedPolicy={selectedPolicy}
            onPolicyUpdate={onPolicyUpdate}
          />
        );
      
      case 'relatorios':
        return (
          <SmartApoliceRelatorios
            apolices={apolices}
          />
        );
      
      case 'fipe':
        return (
          <SmartApoliceFipe
            apolices={apolices}
            selectedPolicy={selectedPolicy}
            onPolicyUpdate={onPolicyUpdate}
          />
        );
      
      case 'veiculos':
        return (
          <SmartApoliceVeiculos
            apolices={apolices}
            onPolicyUpdate={onPolicyUpdate}
          />
        );
      
      case 'configuracoes':
        return (
          <SmartApoliceConfiguracoes />
        );
      
      default:
        return (
          <SmartApoliceBuscar
            searchTerm={searchTerm}
            apolices={apolices}
            onPolicyImport={onPolicyImport}
            onPolicySelect={onPolicySelect}
            onPolicyDelete={onPolicyDelete}
          />
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderContent()}
    </div>
  );
}