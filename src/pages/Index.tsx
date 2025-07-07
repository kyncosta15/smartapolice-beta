
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { DashboardContent } from '@/components/DashboardContent';
import { Shield, Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  console.log('🎯 AppContent render:', { 
    user: user?.name || 'None', 
    isLoading,
    userExists: !!user 
  });

  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Shield className="h-16 w-16 text-blue-600/20 mx-auto" />
            </div>
            <Shield className="h-16 w-16 text-blue-600 mx-auto animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">SmartApólice</h2>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
                BETA
              </span>
            </div>
            <p className="text-gray-600">
              Carregando sua central inteligente...
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔐 No user found, showing auth page');
    return <AuthPage />;
  }

  console.log('✅ User authenticated, showing dashboard for:', user.name);
  
  // Adicionar try-catch para capturar erros de renderização
  try {
    return <DashboardContent />;
  } catch (error) {
    console.error('💥 Error rendering dashboard:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-red-600 mb-4">Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
};

const Index = () => {
  console.log('🚀 Index component mounted');
  
  try {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    );
  } catch (error) {
    console.error('💥 Critical error in Index:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Erro crítico</h1>
          <p className="text-red-600 mb-4">Falha ao inicializar a aplicação.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};

export default Index;
