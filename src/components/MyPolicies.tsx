
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

export function MyPolicies() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { policies, updatePolicy } = usePersistedPolicies();
  const { toast } = useToast();
  
  // Converter para formato PolicyWithStatus mantendo o status correto do banco
  const policiesWithStatus: PolicyWithStatus[] = policies.map(policy => {
    // Usar o status diretamente do banco sem validações extras
    const finalStatus = policy.status as PolicyStatus;
    
    console.log(`✅ [MyPolicies] Apólice ${policy.name}: status do banco = ${finalStatus}`);
    
    return {
      id: policy.id,
      name: policy.name,
      insurer: policy.insurer,
      policyNumber: policy.policyNumber,
      type: policy.type,
      monthlyAmount: policy.monthlyAmount,
      startDate: policy.startDate,
      endDate: policy.endDate,
      expirationDate: policy.expirationDate || policy.endDate,
      status: finalStatus
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
          // Buscar dados originais da apólice para quantidade de parcelas
          const originalPolicy = policies.find(p => p.id === policy.id);
          const installmentsCount = originalPolicy?.quantidade_parcelas || 
                                  originalPolicy?.installments?.length || 
                                  12; // Fallback padrão
          
          console.log(`🎯 [MyPolicies-Render] Renderizando ${policy.name} com status: ${policy.status}`);
          
          return (
            <Card key={policy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <Badge className={STATUS_COLORS[policy.status] || STATUS_COLORS.vigente}>
                    {formatStatusText(policy.status)}
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
