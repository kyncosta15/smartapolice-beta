import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardContent } from '@/components/DashboardContent';
import { Shield, Loader2 } from 'lucide-react';
import { TermsModal } from '@/components/auth/TermsModal';
import { PresenceNameModal } from '@/components/PresenceNameModal';
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';

const AuthGuardContent = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  // Hook de presença com heartbeat e IP hash
  const { 
    needsName, 
    isLoading: presenceLoading, 
    setDisplayName 
  } = usePresence(user?.id);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/system-selection');
    }
  }, [user, isLoading, navigate]);

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
          setShowTermsModal(true);
          setTermsChecked(true);
          return;
        }

        const currentVersion = '1.0';
        const needsAcceptance = !data?.termos_aceitos || data?.termos_versao !== currentVersion;
        
        console.log('AuthGuard - Verificação de termos:', { 
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

    if (user && profile && !isLoading) {
      checkTermsAcceptance();
    }
  }, [user, profile, isLoading]);

  const handleTermsAccept = () => {
    setShowTermsModal(false);
  };

  if (isLoading) {
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
    return null; // Redirecionamento será feito pelo useEffect
  }

  // Se for admin, não renderizar nada (vai redirecionar)
  if (profile?.is_admin) {
    return null;
  }

  // Mostrar modal de termos se necessário
  return (
    <>
      <DashboardContent />
      {showTermsModal && termsChecked && user && (
        <TermsModal 
          open={showTermsModal} 
          onAccept={handleTermsAccept}
          userId={user.id}
        />
      )}
      {/* Modal de identificação de presença */}
      {!presenceLoading && needsName && user && !showTermsModal && (
        <PresenceNameModal
          open={needsName}
          onSetName={setDisplayName}
        />
      )}
    </>
  );
};

const AuthGuard = () => {
  return <AuthGuardContent />;
};

// Ensure proper default export
export default AuthGuard;
