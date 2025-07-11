
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
    const expiredPolicy = policies.find(policy => {
      if (!policy.expirationDate && !policy.endDate) return false;
      
      // Usar expirationDate ou endDate como fallback
      const expirationDate = new Date(policy.expirationDate || policy.endDate);
      const isExpired = expirationDate < now;
      
      console.log(`📅 Apólice ${policy.name}: vencimento ${expirationDate.toLocaleDateString('pt-BR')}, vencida: ${isExpired}`);
      
      // Verificar se está vencida e ainda tem status vigente/ativa
      return isExpired && (policy.status === "vigente" || policy.status === "ativa" || !policy.status);
    });

    if (expiredPolicy && !renewalAlert) {
      console.log('⚠️ Apólice vencida encontrada:', expiredPolicy.name);
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
