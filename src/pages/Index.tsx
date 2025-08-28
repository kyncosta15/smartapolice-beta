
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/AuthPage';
import { DashboardContent } from '@/components/DashboardContent';
import { Shield, Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, isLoading, isInitialized } = useAuth();

  console.log('🎯 AppContent render:', { 
    user: user?.name || 'Nenhum', 
    isLoading,
    isInitialized,
    userExists: !!user 
  });

  // Mostrar loading apenas enquanto auth não foi inicializada
  if (!isInitialized || isLoading) {
    console.log('⏳ Mostrando tela de loading');
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
              {isInitialized ? 'Carregando dados do usuário...' : 'Inicializando sistema...'}
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
    console.log('🔐 Usuário não encontrado, mostrando página de auth');
    return <AuthPage />;
  }

  console.log('✅ Usuário autenticado, mostrando dashboard para:', user.name);
  return <DashboardContent />;
};

const Index = () => {
  console.log('🚀 Componente Index montado');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
