import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  // Check role permissions
  const userRole = profile.role;
  const isAdmin = profile.is_admin === true;
  
  const hasAccess = requiredRoles.length === 0 || 
    requiredRoles.some(role => {
      // Para roles de admin, verificar is_admin flag (usado nas RLS policies)
      if (role === 'admin' || role === 'administrador') {
        return isAdmin;
      }
      // Para outras roles, verificar profile.role
      return userRole === role;
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
            Seu perfil: {userRole} {isAdmin ? '(Admin)' : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            Perfil necessário: {requiredRoles.join(', ')}
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

  return <>{children}</>;
};

export default ProtectedRoute;