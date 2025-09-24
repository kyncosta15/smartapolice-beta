import React, { useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';

const SmartApoliceAuthContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header com navegação */}
      <header className="p-6 flex items-center justify-between">
        <Link to="/system-selection" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
        <div className="flex items-center gap-4">
        </div>
        <div className="w-16"></div>
      </header>

      {/* Conteúdo da autenticação */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <AuthPage />
          </CardContent>
        </Card>
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