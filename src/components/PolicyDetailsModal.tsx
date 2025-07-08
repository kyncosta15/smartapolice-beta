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

  const coverages = policy.coberturas || policy.coverage || [];

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
              <Trash2 className="h-4 w-3 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogHeader>

        {/* DUAS COLUNAS DE CARDS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 items-start">
          {/* Coluna da esquerda */}
          <div className="flex flex-col gap-6">
            <GeneralInfoCard policy={policy} />
            <InsurerInfoCard policy={policy} />

            {/* Vigência e Veículo lado a lado */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ValidityInfoCard policy={policy} />
              {policy.vehicleModel && (
                <VehicleInfoCard policy={policy} />
              )}
            </div>
          </div>

          {/* Coluna da direita */}
          <div className="flex flex-col gap-6">
            <FinancialInfoCard policy={policy} />
            <CoveragesCard coverages={coverages} />
            {(policy.insuredName || policy.documento) && (
              <ResponsiblePersonCard policy={policy} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
