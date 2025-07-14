
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { useRenewalChecker } from '@/hooks/useRenewalChecker';
import { RenewalModal } from '@/components/RenewalModal';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useToast } from '@/hooks/use-toast';

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

export function MyPolicies() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { policies, updatePolicy } = usePersistedPolicies();
  const { toast } = useToast();
  
  // Converter para formato PolicyWithStatus com status correto
  const policiesWithStatus: PolicyWithStatus[] = policies.map(policy => {
    const policyWithStatus: PolicyWithStatus = {
      id: policy.id,
      name: policy.name,
      insurer: policy.insurer,
      policyNumber: policy.policyNumber,
      type: policy.type,
      monthlyAmount: policy.monthlyAmount,
      startDate: policy.startDate,
      endDate: policy.endDate,
      expirationDate: policy.expirationDate || policy.endDate,
      status: policy.status as PolicyStatus || 'vigente'
    };
    
    // Determinar status correto baseado na data
    const correctStatus = determineCorrectStatus(policyWithStatus);
    
    // Se o status mudou, atualizar no banco
    if (policyWithStatus.status !== correctStatus) {
      console.log(`🔄 Status da apólice ${policy.name} será atualizado: ${policyWithStatus.status} -> ${correctStatus}`);
      
      // Atualizar no banco de forma assíncrona
      updatePolicy(policy.id, { status: correctStatus }).then(success => {
        if (success) {
          console.log(`✅ Status da apólice ${policy.name} atualizado com sucesso`);
        }
      });
    }
    
    return {
      ...policyWithStatus,
      status: correctStatus // Usar sempre o status correto
    };
  });
  
  // Hook para verificar renovações
  const renewalAlert = useRenewalChecker(policiesWithStatus);

  const handleRenewalDecision = async (policy: PolicyWithStatus, newStatus: PolicyStatus) => {
    console.log(`🔄 [handleRenewalDecision] Atualizando status: ${policy.id} -> ${newStatus}`);
    
    // Atualizar no banco
    const updateSuccess = await updatePolicy(policy.id, { status: newStatus });
    
    if (updateSuccess) {
      toast({
        title: "✅ Status Atualizado",
        description: `Status da apólice alterado para: ${formatStatusText(newStatus)}`,
      });
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
          {policiesWithStatus.length} apólice{policiesWithStatus.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policiesWithStatus.map((policy) => {
          // SEMPRE usar status correto e atualizado
          const currentStatus = determineCorrectStatus(policy);
          
          // Buscar dados originais da apólice para quantidade de parcelas
          const originalPolicy = policies.find(p => p.id === policy.id);
          const installmentsCount = originalPolicy?.installments?.length || 
                                  originalPolicy?.quantidade_parcelas ||
                                  12; // Fallback padrão
          
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
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Parcelas</p>
                    <p className="font-medium">{installmentsCount}x</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vencimento</p>
                    <p className={`font-medium ${
                      new Date(policy.expirationDate || policy.endDate) < new Date() 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    }`}>
                      {new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
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
