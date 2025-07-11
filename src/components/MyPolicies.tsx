
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

export function MyPolicies() {
  const [policies, setPolicies] = useState<PolicyWithStatus[]>(initialPolicies);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Hook para verificar renovações
  const renewalAlert = useRenewalChecker(policies);

  const handleRenewalDecision = async (policy: PolicyWithStatus, newStatus: PolicyStatus) => {
    // Atualizar o estado local
    setPolicies(ps => ps.map(p =>
      p.id === policy.id ? { ...p, status: newStatus } : p
    ));

    // TODO: Chamar API para persistir no backend
    console.log(`Atualizando apólice ${policy.id} para status: ${newStatus}`);
    
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
        {policies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{policy.name}</CardTitle>
                <Badge className={STATUS_COLORS[policy.status]}>
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
              
              <div className="text-sm">
                <p className="text-gray-500">Vencimento</p>
                <p className={`font-medium ${
                  new Date(policy.expirationDate) < new Date() 
                    ? 'text-red-600' 
                    : 'text-gray-900'
                }`}>
                  {new Date(policy.expirationDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
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
