
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyDataMapper } from '@/utils/policyDataMapper';
import { extractFieldValue, extractNumericValue } from '@/utils/extractFieldValue';

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
    console.log('🔄 Normalizando políticas para renderização 100% segura:', policies.length);
    
    if (!Array.isArray(policies)) {
      console.warn('⚠️ Policies não é um array:', policies);
      return [];
    }
    
    return policies.map((policy, index) => {
      try {
        // Verificar se a política é um objeto válido
        if (!policy || typeof policy !== 'object') {
          console.warn(`⚠️ Política inválida no índice ${index}:`, policy);
          return {
            id: `invalid-${index}`,
            name: 'Política Inválida',
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

        // Usar o PolicyDataMapper para extrair dados de forma 100% segura
        const normalizedPolicy: NormalizedPolicy = {
          id: String(policy.id || `policy-${index}`),
          name: PolicyDataMapper.getInsuredName(policy),
          insurer: PolicyDataMapper.getInsurerName(policy),
          policyNumber: PolicyDataMapper.getPolicyNumber(policy),
          type: PolicyDataMapper.getPolicyType(policy),
          monthlyAmount: PolicyDataMapper.getMonthlyAmount(policy),
          startDate: extractFieldValue(policy.startDate) || '',
          endDate: extractFieldValue(policy.endDate) || '',
          expirationDate: extractFieldValue(policy.expirationDate || policy.endDate) || '',
          status: PolicyDataMapper.getStatus(policy),
          installmentsCount: extractNumericValue(policy.quantidade_parcelas) || 
                           (Array.isArray(policy.installments) ? policy.installments.length : 0) || 
                           12
        };

        console.log(`✅ Política normalizada com segurança: ${normalizedPolicy.name}`, {
          originalData: policy,
          normalizedData: normalizedPolicy
        });

        return normalizedPolicy;
      } catch (error) {
        console.error(`❌ Erro ao normalizar política no índice ${index}:`, error, policy);
        
        // Retornar dados seguros em caso de erro
        return {
          id: `error-${index}-${Date.now()}`,
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
