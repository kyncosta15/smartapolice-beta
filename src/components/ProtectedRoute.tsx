import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TermsModal } from '@/components/auth/TermsModal';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  // Verificar se precisa mostrar modal de termos
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!user || !profile) {
        setTermsChecked(true);
        return;
      }

      // Admin não precisa aceitar termos
      if (profile.is_admin === true) {
        setShowTermsModal(false);
        setTermsChecked(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('termos_aceitos, termos_versao')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar termos:', error);
          // Se deu erro, mostra modal por segurança
          setShowTermsModal(true);
          setTermsChecked(true);
          return;
        }

        const currentVersion = '1.0';
        const needsAcceptance = !data?.termos_aceitos || data?.termos_versao !== currentVersion;
        
        console.log('Verificação de termos:', { 
          userId: user.id, 
          termos_aceitos: data?.termos_aceitos, 
          termos_versao: data?.termos_versao,
          needsAcceptance 
        });
        
        setShowTermsModal(needsAcceptance);
        setTermsChecked(true);
      } catch (error) {
        console.error('Erro ao verificar termos:', error);
        setShowTermsModal(true);
        setTermsChecked(true);
      }
    };

    if (user && profile && !loading) {
      checkTermsAcceptance();
    }
  }, [user, profile, loading]);

  const handleTermsAccept = () => {
    setShowTermsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!profile) {
    // Profile not loaded yet or doesn't exist
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando perfil...</h2>
          <p className="text-muted-foreground">Aguarde enquanto carregamos seus dados.</p>
        </div>
      </div>
    );
  }

  if (!profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Conta Inativa</h2>
          <p className="text-muted-foreground">
            Sua conta está inativa. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  // Check role permissions - simplificado para apenas admin/usuário
  const isAdmin = profile.is_admin === true;
  
  const hasAccess = requiredRoles.length === 0 || 
    requiredRoles.some(role => {
      // Verificar is_admin flag para admins
      if (role === 'admin' || role === 'administrador') {
        return isAdmin;
      }
      return false;
    });

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground">
            Seu perfil: {isAdmin ? 'Usuário' : 'Admin'}
          </p>
          <p className="text-sm text-muted-foreground">
            Esta página requer privilégios de administrador
          </p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Mostrar modal de termos se necessário (exceto para admin)
  if (showTermsModal && termsChecked && !isAdmin) {
    return (
      <>
        {children}
        <TermsModal 
          open={showTermsModal} 
          onAccept={handleTermsAccept}
          userId={user.id}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
