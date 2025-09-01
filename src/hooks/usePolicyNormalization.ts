
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyDataMapper } from '@/utils/policyDataMapper';

interface NormalizedPolicy {
  id: string;
  name: string;
  insurer: string;
  policyNumber: string;
  type: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  expirationDate: string;
  status: string;
  installmentsCount: number;
}

export const usePolicyNormalization = (policies: ParsedPolicyData[]): NormalizedPolicy[] => {
  return useMemo(() => {
    console.log('🔄 Normalizando políticas para renderização segura:', policies.length);
    
    return policies.map(policy => {
      try {
        // Usar o PolicyDataMapper para extrair dados de forma segura
        const normalizedPolicy: NormalizedPolicy = {
          id: policy.id || 'unknown',
          name: PolicyDataMapper.getInsuredName(policy),
          insurer: PolicyDataMapper.getInsurerName(policy),
          policyNumber: policy.policyNumber || 'N/A',
          type: policy.type || 'Não informado',
          monthlyAmount: PolicyDataMapper.getMonthlyAmount(policy),
          startDate: policy.startDate || '',
          endDate: policy.endDate || '',
          expirationDate: policy.expirationDate || policy.endDate || '',
          status: PolicyDataMapper.getStatus(policy),
          installmentsCount: policy.quantidade_parcelas || 
                           (Array.isArray(policy.installments) ? policy.installments.length : 0) || 
                           12
        };

        console.log(`✅ Política normalizada: ${normalizedPolicy.name}`, {
          originalInsurer: policy.insurer,
          normalizedInsurer: normalizedPolicy.insurer,
          originalName: policy.name,
          normalizedName: normalizedPolicy.name
        });

        return normalizedPolicy;
      } catch (error) {
        console.error('❌ Erro ao normalizar política:', error, policy);
        
        // Retornar dados seguros em caso de erro
        return {
          id: policy.id || `error-${Date.now()}`,
          name: 'Erro na Política',
          insurer: 'Não informado',
          policyNumber: 'N/A',
          type: 'Não informado',
          monthlyAmount: 0,
          startDate: '',
          endDate: '',
          expirationDate: '',
          status: 'erro',
          installmentsCount: 0
        };
      }
    });
  }, [policies]);
};
