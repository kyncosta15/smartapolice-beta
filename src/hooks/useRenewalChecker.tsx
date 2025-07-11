
import { useEffect, useState } from 'react';
import { PolicyWithStatus } from '@/types/policyStatus';

interface RenewalAlert {
  toRenew: PolicyWithStatus;
  clear: () => void;
}

export function useRenewalChecker(policies: PolicyWithStatus[]): RenewalAlert | null {
  const [renewalAlert, setRenewalAlert] = useState<RenewalAlert | null>(null);

  useEffect(() => {
    // Encontrar a primeira apólice vigente que está vencida
    const vigentePolicy = policies.find(policy => 
      policy.status === "vigente" && 
      new Date(policy.expirationDate) < new Date()
    );

    if (vigentePolicy && !renewalAlert) {
      setRenewalAlert({
        toRenew: vigentePolicy,
        clear: () => setRenewalAlert(null)
      });
    }
  }, [policies, renewalAlert]);

  return renewalAlert;
}
