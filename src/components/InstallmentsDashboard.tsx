import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { InstallmentsSummaryCards } from '@/components/installments/InstallmentsSummaryCards';
import { PolicyInstallmentsCard } from '@/components/installments/PolicyInstallmentsCard';
import { UpcomingInstallmentsList } from '@/components/installments/UpcomingInstallmentsList';
import { 
  generateSimulatedInstallments, 
  createExtendedInstallments,
  filterUpcomingInstallments,
  filterOverdueInstallments,
  calculateDuingNext30Days,
  calculateDuingNext60Days
} from '@/utils/installmentUtils';

interface InstallmentsDashboardProps {
  policies: ParsedPolicyData[];
}

export function InstallmentsDashboard({ policies }: InstallmentsDashboardProps) {
  // Verificar se há apólices com dados de parcelas detalhadas
  const policiesWithInstallments = policies.filter(policy => 
    Array.isArray(policy.installments) && policy.installments.length > 0
  );

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma apólice encontrada</h3>
          <p className="text-gray-500">As apólices aparecerão aqui quando forem processadas</p>
        </CardContent>
      </Card>
    );
  }

  // Se não há dados de parcelas, criar dados simulados baseados nos dados das apólices
  if (policiesWithInstallments.length === 0) {
    console.log('Criando dados simulados de parcelas para', policies.length, 'apólices');
    
    // Criar parcelas simuladas baseadas nos dados disponíveis
    const simulatedPolicies = policies.map(policy => ({
      ...policy,
      installments: generateSimulatedInstallments(policy)
    }));

    return renderInstallmentsDashboard(simulatedPolicies);
  }

  return renderInstallmentsDashboard(policiesWithInstallments);
}

function renderInstallmentsDashboard(policiesWithInstallments: ParsedPolicyData[]) {
  // Criar lista estendida de parcelas
  const allInstallments = createExtendedInstallments(policiesWithInstallments);
  
  // Filtrar parcelas por status
  const upcomingInstallments = filterUpcomingInstallments(allInstallments);
  const overdueInstallments = filterOverdueInstallments(allInstallments);
  
  // Calcular parcelas que vencem nos próximos 30 dias
  const duingNext30Days = calculateDuingNext30Days(allInstallments);
  
  // Calcular totais gerais
  const totalInstallments = allInstallments.length;
  const totalValue = allInstallments.reduce((sum, installment) => sum + installment.valor, 0);
  
  // Calcular totais por categoria
  const totalUpcoming = upcomingInstallments.reduce((sum, installment) => sum + installment.valor, 0);
  const totalOverdue = overdueInstallments.reduce((sum, installment) => sum + installment.valor, 0);

  console.log('Dashboard Stats:', {
    totalInstallments,
    upcomingCount: upcomingInstallments.length,
    overdueCount: overdueInstallments.length,
    duingNext30Days,
    totalValue,
    totalUpcoming,
    totalOverdue
  });

  return (
    <div className="space-y-6">
      {/* Resumo Geral das Parcelas */}
      <InstallmentsSummaryCards
        totalInstallments={totalInstallments}
        totalValue={totalValue}
        upcomingInstallments={upcomingInstallments.length}
        totalUpcoming={totalUpcoming}
        overdueInstallments={overdueInstallments.length}
        totalOverdue={totalOverdue}
      />

      {/* Detalhamento por Apólice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policiesWithInstallments.map((policy, index) => (
          <PolicyInstallmentsCard key={policy.id || index} policy={policy} index={index} />
        ))}
      </div>

      {/* Lista de Próximas Parcelas */}
      <UpcomingInstallmentsList upcomingInstallments={upcomingInstallments} />
    </div>
  );
}
