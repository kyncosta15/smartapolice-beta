
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Settings, Phone, Users, Shield, Upload, FileText } from 'lucide-react';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { PolicyTable } from '@/components/PolicyTable';
import { ChartsSection } from '@/components/ChartsSection';
import { EnhancedPDFUpload } from '@/components/EnhancedPDFUpload';
import { PolicyViewer } from '@/components/PolicyViewer';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ClientRegistration } from '@/components/ClientRegistration';
import { OptimizedSettings } from '@/components/OptimizedSettings';
import { RegionalDashboard } from '@/components/RegionalDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface ContentRendererProps {
  activeSection: string;
  searchTerm: string;
  filterType: string;
  allPolicies: any[];
  extractedPolicies: any[];
  allUsers: any[];
  onPolicySelect: (policy: any) => void;
  onPolicyUpdate: (updatedPolicy: any) => void;
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
  onSectionChange,
}: ContentRendererProps) {
  const { user } = useAuth();
  
  const handleNotificationClick = () => {
    console.log('Notificações clicadas');
  };

  const handlePolicyEdit = (policy: any) => {
    onPolicyUpdate(policy);
  };

  // Get policies based on user role
  const getUserPolicies = () => {
    if (user?.role === 'administrador') {
      return allPolicies; // Admin sees all policies
    }
    return extractedPolicies; // Clients see only their extracted policies
  };

  const userPolicies = getUserPolicies();

  switch (activeSection) {
    case 'home':
      return (
        <div className="w-full max-w-none space-y-4 p-4 overflow-hidden">
          <EnhancedDashboard 
            policies={userPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          
          {/* Admin Regional Dashboard - Only visible to administrators */}
          {user?.role === 'administrador' && (
            <div className="w-full">
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Dashboard Regional - Visão Administrativa
                  </CardTitle>
                </CardHeader>
              </Card>
              <RegionalDashboard policies={allPolicies} />
            </div>
          )}
          
          {/* Quick Actions - Enhanced layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all cursor-pointer ring-2 ring-blue-200 ring-opacity-50" 
                  onClick={() => onSectionChange('import')}>
              <CardContent className="p-4 text-center">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📄 Upload PDF</h3>
                <p className="text-sm text-blue-600 font-medium mb-3">Adicione PDFs e extraia dados automaticamente</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Enviar Arquivo
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSectionChange('policies')}>
              <CardContent className="p-4 text-center">
                <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-green-800 mb-2">Minhas Apólices</h3>
                <p className="text-sm text-green-600">Visualize e gerencie suas apólices</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSectionChange('financial')}>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-purple-800 mb-2">Relatório Financeiro</h3>
                <p className="text-sm text-purple-600">Acompanhe custos e economias</p>
              </CardContent>
            </Card>
          </div>

          {/* Main content grid - Layout otimizado */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-3 min-w-0">
              <PolicyTable 
                searchTerm={searchTerm}
                filterType={filterType}
                onPolicySelect={onPolicySelect}
                extractedPolicies={userPolicies}
                onPolicyUpdate={onPolicyUpdate}
                onPolicyDelete={onPolicyDelete}
              />
            </div>
            <div className="xl:col-span-2 min-w-0">
              <ChartsSection />
            </div>
          </div>
        </div>
      );

    case 'policies':
      return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
          <PolicyViewer
            policies={userPolicies}
            onPolicySelect={onPolicySelect}
            onPolicyEdit={handlePolicyEdit}
            onPolicyDelete={onPolicyDelete}
          />
        </div>
      );

    case 'admin':
      if (user?.role !== 'administrador') {
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Acesso restrito a administradores</p>
          </div>
        );
      }
      return (
        <AdminDashboard
          allUsers={allUsers}
          allPolicies={allPolicies}
          onUserUpdate={onUserUpdate}
          onUserDelete={onUserDelete}
          onPolicyUpdate={onPolicyUpdate}
          onPolicyDelete={onPolicyDelete}
        />
      );

    case 'register-client':
      if (user?.role !== 'administrador') {
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Acesso restrito a administradores</p>
          </div>
        );
      }
      return <ClientRegistration onClientRegister={onClientRegister} />;

    case 'import':
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <EnhancedPDFUpload onPolicyExtracted={onPolicyExtracted} />
        </div>
      );

    case 'financial':
      return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
          <EnhancedDashboard 
            policies={userPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <DollarSign className="h-4 w-4 mr-2" />
                Detalhamento Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-700 mb-2 break-words text-sm">Custo Mensal Total</h3>
                  <p className="text-2xl font-bold text-green-600 break-all">
                    R$ {userPolicies.reduce((sum, p) => sum + (p.monthlyAmount || p.premium / 12), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 mt-1 break-words">Todas as apólices ativas</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-700 mb-2 break-words text-sm">Total Segurado</h3>
                  <p className="text-2xl font-bold text-blue-600 break-all">
                    R$ {userPolicies.reduce((sum, p) => sum + p.premium, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 break-words">Valor total dos prêmios</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-700 mb-2 break-words text-sm">Economia Potencial</h3>
                  <p className="text-2xl font-bold text-purple-600">R$ 2.450</p>
                  <p className="text-xs text-purple-600 mt-1 break-words">Com otimização sugerida</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'settings':
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <OptimizedSettings />
        </div>
      );

    case 'about':
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Users className="h-4 w-4 mr-2" />
                Sobre a SmartApólice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    SmartApólice
                  </h2>
                  <p className="text-gray-600 text-sm">Central Inteligente de Apólices</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl">
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm">Nossa Missão</h3>
                    <p className="text-gray-700 text-xs break-words">
                      Oferecer controle total, previsibilidade financeira e segurança jurídica
                      sobre todas as apólices corporativas em um único painel inteligente.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/30 rounded-xl">
                    <h3 className="font-semibold text-green-800 mb-2 text-sm">Tecnologia IA</h3>
                    <p className="text-gray-700 text-xs break-words">
                      Utilizamos OCR avançado e processamento inteligente para extrair
                      automaticamente dados de PDFs e imagens, com precisão superior a 95%.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'contact':
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Phone className="h-4 w-4 mr-2" />
                Entre em Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm">Suporte Técnico</h3>
                    <p className="text-gray-700 text-sm break-words">suporte@smartapolice.com.br</p>
                    <p className="text-gray-700 text-sm">(11) 99999-9999</p>
                    <p className="text-xs text-gray-600 mt-1">Segunda a Sexta, 8h às 18h</p>
                  </div>
                  
                  <div className="p-3 bg-green-50/50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2 text-sm">Vendas</h3>
                    <p className="text-gray-700 text-sm break-words">vendas@smartapolice.com.br</p>
                    <p className="text-gray-700 text-sm">(11) 88888-8888</p>
                    <p className="text-xs text-gray-600 mt-1">Segunda a Sexta, 9h às 17h</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-xl">
                  <h3 className="font-semibold text-purple-800 mb-3 text-sm">Precisa de Ajuda?</h3>
                  <p className="text-gray-700 mb-4 text-xs break-words">
                    Nossa equipe está pronta para ajudar você a aproveitar ao máximo
                    todas as funcionalidades da SmartApólice.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                    Agendar Demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return (
        <div className="w-full max-w-none space-y-4 p-4 overflow-hidden">
          <EnhancedDashboard 
            policies={userPolicies} 
            onNotificationClick={handleNotificationClick}
          />
          
          {/* Admin Regional Dashboard - Only visible to administrators */}
          {user?.role === 'administrador' && (
            <div className="w-full">
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Dashboard Regional - Visão Administrativa
                  </CardTitle>
                </CardHeader>
              </Card>
              <RegionalDashboard policies={allPolicies} />
            </div>
          )}
          
          {/* Quick Actions - Enhanced layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all cursor-pointer ring-2 ring-blue-200 ring-opacity-50" 
                  onClick={() => onSectionChange('import')}>
              <CardContent className="p-4 text-center">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📄 Upload PDF</h3>
                <p className="text-sm text-blue-600 font-medium mb-3">Adicione PDFs e extraia dados automaticamente</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Enviar Arquivo
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSectionChange('policies')}>
              <CardContent className="p-4 text-center">
                <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-green-800 mb-2">Minhas Apólices</h3>
                <p className="text-sm text-green-600">Visualize e gerencie suas apólices</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSectionChange('financial')}>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-purple-800 mb-2">Relatório Financeiro</h3>
                <p className="text-sm text-purple-600">Acompanhe custos e economias</p>
              </CardContent>
            </Card>
          </div>

          {/* Main content grid - Layout otimizado */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-3 min-w-0">
              <PolicyTable 
                searchTerm={searchTerm}
                filterType={filterType}
                onPolicySelect={onPolicySelect}
                extractedPolicies={userPolicies}
                onPolicyUpdate={onPolicyUpdate}
                onPolicyDelete={onPolicyDelete}
              />
            </div>
            <div className="xl:col-span-2 min-w-0">
              <ChartsSection />
            </div>
          </div>
        </div>
      );
  }
}
