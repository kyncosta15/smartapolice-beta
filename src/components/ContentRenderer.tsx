
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Settings, Phone, Users, Shield } from 'lucide-react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { PolicyTable } from '@/components/PolicyTable';
import { ChartsSection } from '@/components/ChartsSection';
import { EnhancedPDFUpload } from '@/components/EnhancedPDFUpload';
import { PolicyViewer } from '@/components/PolicyViewer';
import { OptimizedSettings } from '@/components/OptimizedSettings';
import { RegionalDashboard } from '@/components/RegionalDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface ContentRendererProps {
  activeSection: string;
  searchTerm: string;
  filterType: string;
  allPolicies: any[];
  extractedPolicies: any[];
  onPolicySelect: (policy: any) => void;
  onPolicyUpdate: (updatedPolicy: any) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicyExtracted: (policy: any) => void;
}

export function ContentRenderer({
  activeSection,
  searchTerm,
  filterType,
  allPolicies,
  extractedPolicies,
  onPolicySelect,
  onPolicyUpdate,
  onPolicyDelete,
  onPolicyExtracted,
}: ContentRendererProps) {
  const { user } = useAuth();
  
  const handleNotificationClick = () => {
    console.log('Notificações clicadas');
    // Implementar modal de notificações
  };

  const handlePolicyEdit = (policy: any) => {
    // Usar a mesma função onPolicyUpdate
    onPolicyUpdate(policy);
  };

  switch (activeSection) {
    case 'home':
      return (
        <div className="space-y-8">
          <EnhancedDashboard 
            policies={allPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PolicyTable 
                searchTerm={searchTerm}
                filterType={filterType}
                onPolicySelect={onPolicySelect}
                extractedPolicies={extractedPolicies}
                onPolicyUpdate={onPolicyUpdate}
                onPolicyDelete={onPolicyDelete}
              />
            </div>
            <div>
              <ChartsSection />
            </div>
          </div>
        </div>
      );

    case 'policies':
      return (
        <div className="space-y-6">
          <PolicyViewer
            policies={allPolicies}
            onPolicySelect={onPolicySelect}
            onPolicyEdit={handlePolicyEdit}
            onPolicyDelete={onPolicyDelete}
          />
          
          {user?.role === 'administrador' && (
            <div className="mt-8">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Dashboard Regional - Visão Administrativa
                  </CardTitle>
                </CardHeader>
              </Card>
              <RegionalDashboard policies={allPolicies} />
            </div>
          )}
        </div>
      );

    case 'import':
      return <EnhancedPDFUpload onPolicyExtracted={onPolicyExtracted} />;

    case 'financial':
      return (
        <div className="space-y-6">
          <EnhancedDashboard 
            policies={allPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Detalhamento Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-green-700 mb-2">Custo Mensal Total</h3>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {allPolicies.reduce((sum, p) => sum + (p.monthlyAmount || p.premium / 12), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Todas as apólices ativas</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-blue-700 mb-2">Total Segurado</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    R$ {allPolicies.reduce((sum, p) => sum + p.premium, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">Valor total dos prêmios</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-purple-700 mb-2">Economia Potencial</h3>
                  <p className="text-3xl font-bold text-purple-600">R$ 2.450</p>
                  <p className="text-sm text-purple-600 mt-1">Com otimização sugerida</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'settings':
      return <OptimizedSettings />;

    case 'about':
      return (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Sobre a SmartApólice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  SmartApólice
                </h2>
                <p className="text-gray-600">Central Inteligente de Apólices</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-3">Nossa Missão</h3>
                  <p className="text-gray-700 text-sm">
                    Oferecer controle total, previsibilidade financeira e segurança jurídica
                    sobre todas as apólices corporativas em um único painel inteligente.
                  </p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/30 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-3">Tecnologia IA</h3>
                  <p className="text-gray-700 text-sm">
                    Utilizamos OCR avançado e processamento inteligente para extrair
                    automaticamente dados de PDFs e imagens, com precisão superior a 95%.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'contact':
      return (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Entre em Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Suporte Técnico</h3>
                  <p className="text-gray-700">suporte@smartapolice.com.br</p>
                  <p className="text-gray-700">(11) 99999-9999</p>
                  <p className="text-sm text-gray-600 mt-2">Segunda a Sexta, 8h às 18h</p>
                </div>
                
                <div className="p-4 bg-green-50/50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Vendas</h3>
                  <p className="text-gray-700">vendas@smartapolice.com.br</p>
                  <p className="text-gray-700">(11) 88888-8888</p>
                  <p className="text-sm text-gray-600 mt-2">Segunda a Sexta, 9h às 17h</p>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-xl">
                <h3 className="font-semibold text-purple-800 mb-4">Precisa de Ajuda?</h3>
                <p className="text-gray-700 mb-4">
                  Nossa equipe está pronta para ajudar você a aproveitar ao máximo
                  todas as funcionalidades da SmartApólice.
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Agendar Demonstração
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <div className="space-y-8">
          <EnhancedDashboard 
            policies={allPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PolicyTable 
                searchTerm={searchTerm}
                filterType={filterType}
                onPolicySelect={onPolicySelect}
                extractedPolicies={extractedPolicies}
                onPolicyUpdate={onPolicyUpdate}
                onPolicyDelete={onPolicyDelete}
              />
            </div>
            <div>
              <ChartsSection />
            </div>
          </div>
        </div>
      );
  }
}
