
import { useEffect, useState } from 'react';
import { PolicyWithStatus } from '@/types/policyStatus';

interface RenewalAlert {
  toRenew: PolicyWithStatus;
  clear: () => void;
}

export function useRenewalChecker(policies: PolicyWithStatus[]): RenewalAlert | null {
  const [renewalAlert, setRenewalAlert] = useState<RenewalAlert | null>(null);

  useEffect(() => {
    console.log('🔍 Verificando renovações para', policies.length, 'apólices');
    
    // Encontrar apólices que já venceram ou estão vencendo
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const expiredPolicy = policies.find(policy => {
      if (!policy.expirationDate && !policy.endDate) return false;
      
      // Usar expirationDate ou endDate como fallback
      const expirationDate = new Date(policy.expirationDate || policy.endDate);
      expirationDate.setHours(0, 0, 0, 0);
      
      const diffTime = expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isExpiring = diffDays <= 30 && diffDays >= 0; // Vencendo em 30 dias
      const isExpired = diffDays < 0; // Já vencida
      
      console.log(`📅 Apólice ${policy.name}:`, {
        vencimento: expirationDate.toLocaleDateString('pt-BR'),
        diasRestantes: diffDays,
        vencendo: isExpiring,
        vencida: isExpired,
        status: policy.status
      });
      
      // Verificar se precisa de renovação e ainda não foi processada
      return (isExpiring || isExpired) && 
             (policy.status === "vigente" || policy.status === "ativa" || policy.status === "vencendo");
    });

    if (expiredPolicy && !renewalAlert) {
      console.log('⚠️ Apólice precisando de renovação encontrada:', expiredPolicy.name);
      setRenewalAlert({
        toRenew: expiredPolicy,
        clear: () => {
          console.log('🔄 Limpando alerta de renovação');
          setRenewalAlert(null);
        }
      });
    }
  }, [policies, renewalAlert]);

  return renewalAlert;
}
