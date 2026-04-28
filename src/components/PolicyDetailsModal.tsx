import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CoveragesCard } from './policy-details/CoveragesCard';
import { EndossosCard } from './policy-details/EndossosCard';
import { PolicyOverviewHeader } from './policy-details/PolicyOverviewHeader';
import { GeneralInfoCardV2 } from './policy-details/v2/GeneralInfoCardV2';
import { FinancialCardV2 } from './policy-details/v2/FinancialCardV2';
import { VehicleCardV2 } from './policy-details/v2/VehicleCardV2';
import { ResponsibleCardV2 } from './policy-details/v2/ResponsibleCardV2';
// Timeline e hook de installments desativados — não são mais usados nesta visão

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PolicyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onDelete: (policyId: string) => void;
  onUpdate?: () => void;
}

export function PolicyDetailsModal({ isOpen, onClose, policy, onDelete, onUpdate }: PolicyDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!policy) return null;

  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmDelete = () => {
    onDelete(policy.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Coverages
  let coverages = [];
  if (policy.coberturas && Array.isArray(policy.coberturas)) {
    coverages = policy.coberturas;
  } else if (policy.coverage && Array.isArray(policy.coverage)) {
    coverages = policy.coverage.map((desc: string) => ({ descricao: desc, lmi: undefined }));
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-background p-0 gap-0">
          {/* Hero Header — visão geral da apólice */}
          <div className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6 border-b border-border bg-gradient-to-b from-muted/30 to-transparent">
            <PolicyOverviewHeader policy={policy} onDelete={handleDelete} />
          </div>

          <div className="p-5 space-y-4 sm:space-y-5">
            {/* Cards de detalhes em 2 colunas — visual minimalista light/dark */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GeneralInfoCardV2 policy={policy} />
              <FinancialCardV2 policy={policy} />
              <VehicleCardV2 policy={policy} onUpdated={() => onUpdate?.()} />
              <ResponsibleCardV2 policy={policy} />
            </div>

            {/* 6. Coverages - Full width */}
            <CoveragesCard 
              coverages={coverages} 
              policyId={policy.id}
              nosnum={policy.nosnum}
              codfil={policy.codfil}
            />

            {/* 7. Endossos - Full width */}
            <EndossosCard policyId={policy.id} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-3">
              <p>Tem certeza que deseja excluir esta apólice?</p>
              <p className="text-xs">
                Esta ação não pode ser desfeita. Todos os dados relacionados serão permanentemente removidos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Apólice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
