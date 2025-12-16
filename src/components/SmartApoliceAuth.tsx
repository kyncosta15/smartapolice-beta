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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 dark:from-background dark:via-background dark:to-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link
          to="/system-selection"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/12 to-primary/6 mb-4 border border-border/60">
              <img
                src={smartapoliceShield}
                alt="SmartApólice"
                className="h-9 w-9 object-contain"
                loading="eager"
              />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Smart<span className="text-primary">Apólice</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão Inteligente de Apólices</p>
          </div>

          {/* Auth Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <AuthPage />
          </div>
        </div>
      </main>
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
