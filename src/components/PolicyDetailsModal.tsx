
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { GeneralInfoCard } from './policy-details/GeneralInfoCard';
import { InsurerInfoCard } from './policy-details/InsurerInfoCard';
import { FinancialInfoCard } from './policy-details/FinancialInfoCard';
import { CoveragesCard } from './policy-details/CoveragesCard';
import { ValidityInfoCard } from './policy-details/ValidityInfoCard';
import { VehicleInfoCard } from './policy-details/VehicleInfoCard';
import { ResponsiblePersonCard } from './policy-details/ResponsiblePersonCard';

interface PolicyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onDelete: (policyId: string) => void;
}

export function PolicyDetailsModal({ isOpen, onClose, policy, onDelete }: PolicyDetailsModalProps) {
  if (!policy) return null;

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta apólice?')) {
      onDelete(policy.id);
      onClose();
    }
  };

  // Processar coberturas - dar preferência para coberturas do N8N se disponíveis
  let coverages = [];
  
  if (policy.coberturas && Array.isArray(policy.coberturas)) {
    // Coberturas do N8N com estrutura {descricao, lmi}
    coverages = policy.coberturas;
    console.log('📋 Usando coberturas do N8N:', coverages);
  } else if (policy.coverage && Array.isArray(policy.coverage)) {
    // Fallback para coverage legacy (apenas strings)
    coverages = policy.coverage.map((desc: string) => ({ 
      descricao: desc,
      lmi: undefined 
    }));
    console.log('📋 Usando coberturas legacy:', coverages);
  } else {
    // Array vazio se não há coberturas
    coverages = [];
    console.log('📋 Nenhuma cobertura encontrada para a apólice');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 font-sf-pro">
              Detalhes da Apólice
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogHeader>

        {/* GRID DE CARDS: 2 POR LINHA EM TELAS GRANDES */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 items-stretch">
          <GeneralInfoCard policy={policy} />
          <InsurerInfoCard 
            insurer={policy.seguradora || policy.insurer || 'Não informado'}
            policyNumber={policy.numero_apolice || policy.policyNumber || 'Não informado'}
            premium={policy.valor_premio || policy.premium || 0}
            startDate={policy.inicio_vigencia || policy.startDate || ''}
            endDate={policy.fim_vigencia || policy.endDate || ''}
            paymentFrequency={policy.forma_pagamento || policy.paymentFrequency || 'Não informado'}
            type={policy.tipo_seguro || policy.type || 'Não informado'}
          />

          <ValidityInfoCard policy={policy} />
          {policy.vehicleModel && <VehicleInfoCard policy={policy} />}

          <FinancialInfoCard policy={policy} />
          <CoveragesCard coverages={coverages} policyId={policy.id} />

          {(policy.insuredName || policy.documento) && (
            <ResponsiblePersonCard policy={policy} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
