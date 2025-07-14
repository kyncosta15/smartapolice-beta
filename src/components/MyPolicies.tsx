
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { useRenewalChecker } from '@/hooks/useRenewalChecker';
import { RenewalModal } from '@/components/RenewalModal';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { supabase } from '@/integrations/supabase/client';

// Dados iniciais de exemplo (substitua pela sua fonte de dados)
const initialPolicies: PolicyWithStatus[] = [
  {
    id: '1',
    name: 'Seguro Auto - Honda Civic',
    insurer: 'Porto Seguro',
    policyNumber: 'PS-2024-001',
    type: 'auto',
    monthlyAmount: 450,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    expirationDate: '2024-12-31', // Vencida para teste
    status: 'vigente'
  },
  {
    id: '2', 
    name: 'Seguro Residencial',
    insurer: 'Bradesco Seguros',
    policyNumber: 'BS-2024-002',
    type: 'residencial',
    monthlyAmount: 120,
    startDate: '2024-02-01',
    endDate: '2025-02-01',
    expirationDate: '2025-02-01',
    status: 'aguardando_emissao'
  }
];

// FUNÇÃO PRINCIPAL: Determinar status correto baseado na data de vencimento
const determineCorrectStatus = (policy: PolicyWithStatus): PolicyStatus => {
  const expirationDateStr = policy.expirationDate || policy.endDate;
  
  console.log(`🔍 [determineCorrectStatus] Analisando apólice "${policy.name}":`, {
    id: policy.id,
    expirationDate: expirationDateStr,
    currentStatus: policy.status,
    endDate: policy.endDate
  });
  
  if (!expirationDateStr) {
    console.log(`⚠️ [determineCorrectStatus] Sem data para apólice ${policy.name} - usando 'vigente'`);
    return 'vigente';
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de datas
  
  const expirationDate = new Date(expirationDateStr);
  expirationDate.setHours(0, 0, 0, 0);
  
  // Verificar se a data é válida
  if (isNaN(expirationDate.getTime())) {
    console.error(`❌ [determineCorrectStatus] Data inválida para ${policy.name}: ${expirationDateStr}`);
    return 'vigente';
  }
  
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`📅 [determineCorrectStatus] Análise de vencimento para "${policy.name}":`, {
    expirationDate: expirationDate.toLocaleDateString('pt-BR'),
    today: now.toLocaleDateString('pt-BR'),
    diffDays,
    diffTime
  });
  
  let determinedStatus: PolicyStatus;
  
  // Lógica de determinação de status
  if (diffDays < -30) {
    determinedStatus = 'nao_renovada';
  } else if (diffDays < 0) {
    determinedStatus = 'vencida';
  } else if (diffDays <= 30) {
    determinedStatus = 'vencendo';
  } else {
    determinedStatus = 'vigente';
  }
  
  console.log(`✅ [determineCorrectStatus] Status determinado para "${policy.name}": ${determinedStatus} (${diffDays} dias)`);
  
  return determinedStatus;
};

// FUNÇÃO PARA ATUALIZAR STATUS NO SUPABASE
const updatePolicyStatusInDatabase = async (policyId: string, newStatus: PolicyStatus) => {
  try {
    console.log(`💾 [updatePolicyStatusInDatabase] Atualizando status no banco: ${policyId} -> ${newStatus}`);
    
    const { error } = await supabase
      .from('policies')
      .update({ 
        status: newStatus,
        policy_status: newStatus as any
      })
      .eq('id', policyId);

    if (error) {
      console.error(`❌ [updatePolicyStatusInDatabase] Erro ao atualizar no banco:`, error);
      throw error;
    }

    console.log(`✅ [updatePolicyStatusInDatabase] Status atualizado no banco com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ [updatePolicyStatusInDatabase] Erro crítico:`, error);
    return false;
  }
};

export function MyPolicies() {
  const [policies, setPolicies] = useState<PolicyWithStatus[]>(initialPolicies);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Hook para verificar renovações
  const renewalAlert = useRenewalChecker(policies);

  // FUNÇÃO PRINCIPAL: Atualizar status de todas as apólices
  const updateAllPolicyStatuses = async () => {
    console.log('🔄 [updateAllPolicyStatuses] Iniciando atualização de status...');
    
    const updatedPolicies = await Promise.all(
      policies.map(async (policy) => {
        const correctStatus = determineCorrectStatus(policy);
        
        // Se o status mudou, atualizar no banco
        if (policy.status !== correctStatus) {
          console.log(`🔄 [updateAllPolicyStatuses] Status mudou para ${policy.name}: ${policy.status} -> ${correctStatus}`);
          
          const updateSuccess = await updatePolicyStatusInDatabase(policy.id, correctStatus);
          
          if (updateSuccess) {
            return {
              ...policy,
              status: correctStatus
            };
          } else {
            console.warn(`⚠️ [updateAllPolicyStatuses] Falha ao atualizar ${policy.name} no banco, mantendo status local`);
            return {
              ...policy,
              status: correctStatus
            };
          }
        }
        
        return policy;
      })
    );
    
    setPolicies(updatedPolicies);
    
    console.log('✅ [updateAllPolicyStatuses] Atualização concluída:', 
      updatedPolicies.map(p => ({ id: p.id, name: p.name, status: p.status }))
    );
  };

  // Atualizar status ao montar o componente
  useEffect(() => {
    console.log('🚀 [MyPolicies] Componente montado - iniciando atualização');
    updateAllPolicyStatuses();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(updateAllPolicyStatuses, 5 * 60 * 1000);
    
    return () => {
      console.log('🛑 [MyPolicies] Componente desmontado - limpando interval');
      clearInterval(interval);
    };
  }, []);

  // Atualizar quando políticas mudarem
  useEffect(() => {
    console.log('📊 [MyPolicies] Dados mudaram - verificando necessidade de atualização');
    
    const needsUpdate = policies.some(policy => {
      const correctStatus = determineCorrectStatus(policy);
      return policy.status !== correctStatus;
    });
    
    if (needsUpdate) {
      console.log('🔄 [MyPolicies] Detectada necessidade de atualização');
      updateAllPolicyStatuses();
    }
  }, [policies.length]);

  const handleRenewalDecision = async (policy: PolicyWithStatus, newStatus: PolicyStatus) => {
    console.log(`🔄 [handleRenewalDecision] Atualizando status: ${policy.id} -> ${newStatus}`);
    
    // Atualizar no banco primeiro
    const updateSuccess = await updatePolicyStatusInDatabase(policy.id, newStatus);
    
    if (updateSuccess) {
      // Atualizar estado local
      setPolicies(ps => ps.map(p =>
        p.id === policy.id ? { ...p, status: newStatus } : p
      ));
    }

    // Se escolheu renovar, mostrar modal de confirmação
    if (newStatus === "aguardando_emissao") {
      setShowInfoModal(true);
    }

    // Limpar o alerta de renovação
    renewalAlert?.clear();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Minhas Apólices</h2>
        <Badge variant="secondary">
          {policies.length} apólice{policies.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => {
          // SEMPRE usar status correto e atualizado
          const currentStatus = determineCorrectStatus(policy);
          
          return (
            <Card key={policy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <Badge className={STATUS_COLORS[currentStatus] || STATUS_COLORS.vigente}>
                    {formatStatusText(currentStatus)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{policy.insurer}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Número</p>
                    <p className="font-medium">{policy.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valor Mensal</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(policy.monthlyAmount)}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="text-gray-500">Vencimento</p>
                  <p className={`font-medium ${
                    new Date(policy.expirationDate || policy.endDate) < new Date() 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                  }`}>
                    {new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Renovação */}
      {renewalAlert && (
        <RenewalModal
          policy={renewalAlert.toRenew}
          onDecision={(newStatus) => handleRenewalDecision(renewalAlert.toRenew, newStatus)}
          onClose={renewalAlert.clear}
        />
      )}

      {/* Modal de Informação */}
      <InfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
}
