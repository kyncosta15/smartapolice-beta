import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SmartBeneficiosDashboard } from '@/components/SmartBeneficiosDashboard';
import { Heart, Loader2 } from 'lucide-react';

const SmartBeneficiosGuardContent = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/smartbeneficios');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Heart className="h-16 w-16 text-green-600/20 mx-auto" />
            </div>
            <Heart className="h-16 w-16 text-green-600 mx-auto animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">SmartBenefícios</h2>
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
                MVP
              </span>
            </div>
            <p className="text-gray-600">
              Carregando seu portal de benefícios...
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecionamento será feito pelo useEffect
  }

  return <SmartBeneficiosDashboard />;
};

const SmartBeneficiosGuard = () => {
  return (
    <AuthProvider>
      <SmartBeneficiosGuardContent />
    </AuthProvider>
  );
};

export default SmartBeneficiosGuard;