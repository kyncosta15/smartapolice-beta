import { SmartBeneficiosDashboardMain } from './SmartBeneficiosDashboardMain';
import RHDashboard from '@/pages/RHDashboard';
import { useAuth } from '@/contexts/AuthContext';

// Dashboard principal que decide qual componente renderizar baseado no perfil do usuário
export const SmartBeneficiosDashboard = () => {
  const { user, profile } = useAuth();
  
  // Verificação condicional sem usar hooks depois
  const userClassification = (profile as any)?.classification || (user as any)?.classification || 'Corretora';
  
  // Renderizar componente apropriado baseado na classificação
  if (userClassification === 'Gestão RH') {
    return <RHDashboard />;
  }

  return <SmartBeneficiosDashboardMain />;
};