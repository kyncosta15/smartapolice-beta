
import { useAuth } from '@/contexts/AuthContext';

export function WelcomeSection() {
  const { user } = useAuth();

  const getRoleMessage = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Você tem acesso total ao sistema de gestão de apólices.';
      case 'cliente':
        return 'Gerencie suas apólices de forma inteligente e segura.';
      case 'corretora':
        return 'Administre as apólices dos seus clientes de forma eficiente.';
      default:
        return 'Bem-vindo ao sistema de gestão de apólices.';
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo, {user?.name}!</h2>
      <p className="text-gray-600">{getRoleMessage(user?.role || '')}</p>
    </div>
  );
}
