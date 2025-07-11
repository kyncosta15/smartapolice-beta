
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { useRenewalChecker } from '@/hooks/useRenewalChecker';
import { RenewalModal } from '@/components/RenewalModal';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';

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

// CORREÇÃO PRINCIPAL: Função melhorada para determinar status baseado na data de vencimento
const getCorrectStatus = (policy: PolicyWithStatus): PolicyStatus => {
  const expirationDateStr = policy.expirationDate || policy.endDate;
  
  console.log(`🔍 Analisando status para apólice "${policy.name}":`, {
    id: policy.id,
    expirationDate: expirationDateStr,
    currentStatus: policy.status,
    endDate: policy.endDate
  });
  
  if (!expirationDateStr) {
    console.log(`⚠️ Sem data de vencimento para apólice ${policy.name} - usando status atual: ${policy.status}`);
    return (policy.status as PolicyStatus) || 'vigente';
  }
  
  const now = new Date();
  const expirationDate = new Date(expirationDateStr);
  
  // Verificar se a data é válida
  if (isNaN(expirationDate.getTime())) {
    console.error(`❌ Data de vencimento inválida para apólice ${policy.name}: ${expirationDateStr}`);
    return (policy.status as PolicyStatus) || 'vigente';
  }
  
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`📅 Análise de vencimento para "${policy.name}":`, {
    expirationDate: expirationDate.toLocaleDateString('pt-BR'),
    diffDays,
    now: now.toLocaleDateString('pt-BR'),
    diffTime
  });
  
  let determinedStatus: PolicyStatus;
  
  // Se já venceu há mais de 1 dia
  if (diffDays < -1) {
    determinedStatus = 'nao_renovada';
  }
  // Se venceu hoje ou ontem
  else if (diffDays <= 0) {
    determinedStatus = 'vencida';
  }
  // Se está vencendo nos próximos 30 dias
  else if (diffDays <= 30) {
    determinedStatus = 'vencendo';
  }
  // Caso contrário, está vigente
  else {
    determinedStatus = 'vigente';
  }
  
  console.log(`✅ Status determinado para "${policy.name}": ${determinedStatus} (diff: ${diffDays} dias)`);
  
  return determinedStatus;
};

export function MyPolicies() {
  // CORREÇÃO: Não inicializar com status corrigidos imediatamente
  const [policies, setPolicies] = useState<PolicyWithStatus[]>(initialPolicies);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Hook para verificar renovações
  const renewalAlert = useRenewalChecker(policies);

  // CORREÇÃO PRINCIPAL: Função para atualizar status de todas as apólices
  const updateAllPolicyStatuses = () => {
    console.log('🔄 Atualizando status de todas as apólices...');
    
    setPolicies(prevPolicies => {
      const updatedPolicies = prevPolicies.map(policy => {
        const newStatus = getCorrectStatus(policy);
        
        if (policy.status !== newStatus) {
          console.log(`🔄 Status alterado para apólice ${policy.name}: ${policy.status} -> ${newStatus}`);
        }
        
        return {
          ...policy,
          status: newStatus
        };
      });
      
      console.log('✅ Status de todas as apólices atualizados:', 
        updatedPolicies.map(p => ({ id: p.id, name: p.name, status: p.status }))
      );
      
      return updatedPolicies;
    });
  };

  // Atualizar status das apólices ao montar o componente e periodicamente
  useEffect(() => {
    console.log('🚀 MyPolicies montado - iniciando atualização de status');
    
    // Executar imediatamente
    updateAllPolicyStatuses();
    
    // Executar a cada 5 minutos para manter atualizado
    const interval = setInterval(updateAllPolicyStatuses, 5 * 60 * 1000);
    
    return () => {
      console.log('🛑 MyPolicies desmontado - limpando interval');
      clearInterval(interval);
    };
  }, []); // Só executa uma vez ao montar

  // CORREÇÃO: Atualizar status quando as apólices mudarem (ex: após logout/login)
  useEffect(() => {
    console.log('📊 Dados das apólices mudaram - verificando se precisa atualizar status');
    
    // Verificar se há apólices com status que precisam ser corrigidos
    const needsUpdate = policies.some(policy => {
      const correctStatus = getCorrectStatus(policy);
      return policy.status !== correctStatus;
    });
    
    if (needsUpdate) {
      console.log('🔄 Detectada necessidade de atualização de status');
      updateAllPolicyStatuses();
    }
  }, [policies.length]); // Executa quando o número de apólices muda

  const handleRenewalDecision = async (policy: PolicyWithStatus, newStatus: PolicyStatus) => {
    console.log(`🔄 Atualizando status da apólice ${policy.id} para: ${newStatus}`);
    
    // Atualizar o estado local
    setPolicies(ps => ps.map(p =>
      p.id === policy.id ? { ...p, status: newStatus } : p
    ));

    // TODO: Chamar API para persistir no backend
    console.log(`📡 Atualizando apólice ${policy.id} para status: ${newStatus}`);
    
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
          // CORREÇÃO: Sempre usar o status correto baseado na data atual
          const currentStatus = getCorrectStatus(policy);
          
          return (
            <Card key={policy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <Badge className={STATUS_COLORS[currentStatus] || STATUS_COLORS.desconhecido}>
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
