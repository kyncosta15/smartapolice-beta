console.log('🔍 Importing SmartBeneficiosDashboardMain');
import { SmartBeneficiosDashboardMain } from './SmartBeneficiosDashboardMain';
console.log('🔍 About to import RHDashboard');
import RHDashboard, { testExport } from '@/pages/RHDashboard';
console.log('🔍 RHDashboard imported successfully, testExport:', testExport);
import { useAuth } from '@/contexts/AuthContext';
console.log('🔍 All SmartBeneficiosDashboard imports completed');

// Dashboard principal que decide qual componente renderizar baseado no perfil do usuário
export const SmartBeneficiosDashboard = () => {
  console.log('🔍 Inside SmartBeneficiosDashboard function');
  const { user, profile } = useAuth();
  
  // Verificação condicional sem usar hooks depois
  const userClassification = (profile as any)?.classification || (user as any)?.classification || 'Corretora';
  console.log('🔍 User classification:', userClassification);
  
  // Renderizar componente apropriado baseado na classificação
  if (userClassification === 'Gestão RH') {
    console.log('🔍 Rendering RHDashboard');
    return <RHDashboard />;
  }

  console.log('🔍 Rendering SmartBeneficiosDashboardMain');
  return <SmartBeneficiosDashboardMain />;
};