import React, { useState } from 'react';
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
import { EndossosCard } from './policy-details/EndossosCard';
import { PolicySmartHeader } from './policy-details/PolicySmartHeader';
import { PolicyActionCards } from './policy-details/PolicyActionCards';
import { PolicyInsights } from './policy-details/PolicyInsights';
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
          {/* Sticky Header */}
          <DialogHeader className="border-b border-border pb-4 px-5 pt-5 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-xl font-bold text-foreground">
                Detalhes da Apólice
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-6">
            {/* 1. Smart Header desativado a pedido — exibia "Resumo da apólice hoje" e progresso de pagamentos */}

            {/* Action Cards e Insights desativados a pedido */}

            {/* Cronograma de parcelas desativado a pedido */}


            {/* 5. Detailed Cards - Clean grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GeneralInfoCard policy={policy} />
              <InsurerInfoCard 
                insurer={policy.seguradora || policy.insurer || 'Não informado'}
                type={policy.tipo_seguro || policy.type || 'Não informado'}
              />
              <FinancialInfoCard policy={policy} onInstallmentsUpdate={() => onUpdate?.()} />
              <ValidityInfoCard policy={policy} />
              <VehicleInfoCard policy={policy} onUpdate={() => onUpdate?.()} />
              {(policy.insuredName || policy.documento) && (
                <ResponsiblePersonCard policy={policy} />
              )}
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
