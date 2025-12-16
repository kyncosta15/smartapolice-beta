import React, { useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import smartapoliceShield from '@/assets/smartapolice-shield-transparent.png';

const SmartApoliceAuthContent = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      // Redirecionar admin direto para /admin
      if (profile.is_admin) {
        console.log('✅ SmartApolice: Admin autenticado, redirecionando para /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('✅ SmartApolice: Usuário autenticado, redirecionando para dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background/95 flex flex-col">
      {/* Header com navegação */}
      <header className="p-6">
        <Link to="/system-selection" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </header>

      {/* Conteúdo da autenticação */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo e Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-lg">
                  <img 
                    src={smartapoliceShield} 
                    alt="SmartApólice" 
                    className="h-14 w-14 object-contain" 
                    loading="eager" 
                    fetchPriority="high" 
                  />
                </div>
                {/* Decorative ring */}
                <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-blue-200/50 dark:border-primary/20" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              <span className="text-foreground">Smart</span>
              <span className="text-primary">Apólice</span>
              <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded align-middle">
                BETA
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">Gestão Inteligente de Apólices</p>
          </div>

          {/* Card de autenticação */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-8">
            <AuthPage />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            &copy; 2025 RCorp. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

const SmartApoliceAuth = () => {
  return (
    <AuthProvider>
      <SmartApoliceAuthContent />
    </AuthProvider>
  );
};

export default SmartApoliceAuth;
