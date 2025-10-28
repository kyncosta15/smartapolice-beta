
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
import { renderValue } from '@/utils/renderValue';
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
}

export function PolicyDetailsModal({ isOpen, onClose, policy, onDelete }: PolicyDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!policy) return null;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(policy.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Processar coberturas - dar preferência para coberturas do N8N se disponíveis
  let coverages = [];
  
  if (policy.coberturas && Array.isArray(policy.coberturas)) {
    // Coberturas do N8N com estrutura {descricao, lmi}
    coverages = policy.coberturas;
    console.log('📋 Usando coberturas do N8N:', coverages.map(c => ({ 
      id: c.id, 
      descricao: typeof c.descricao === 'string' ? c.descricao : 'objeto complexo',
      lmi: c.lmi 
    })));
  } else if (policy.coverage && Array.isArray(policy.coverage)) {
    // Fallback para coverage legacy (apenas strings)
    coverages = policy.coverage.map((desc: string) => ({ 
      descricao: desc,
      lmi: undefined 
    }));
    console.log('📋 Usando coberturas legacy:', coverages.map(c => ({ 
      id: c.id, 
      descricao: typeof c.descricao === 'string' ? c.descricao : 'objeto complexo',
      lmi: c.lmi 
    })));
  } else {
    // Array vazio se não há coberturas
    coverages = [];
    console.log('📋 Nenhuma cobertura encontrada para a apólice');
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white p-0">
          <DialogHeader className="border-b border-gray-200 pb-3 px-4 pt-4 sm:px-6 sm:pt-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 font-sf-pro">
                Detalhes da Apólice
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </div>
          </DialogHeader>

          {/* GRID DE CARDS: 2 POR LINHA EM TELAS GRANDES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 items-stretch">
            <GeneralInfoCard policy={policy} />
            <InsurerInfoCard 
              insurer={policy.seguradora || policy.insurer || 'Não informado'}
              type={policy.tipo_seguro || policy.type || 'Não informado'}
            />

            <FinancialInfoCard policy={policy} />
            <CoveragesCard coverages={coverages} policyId={policy.id} />

            <ValidityInfoCard policy={policy} />
            {renderValue(policy.vehicleModel) !== '-' && <VehicleInfoCard policy={policy} />}

            {(policy.insuredName || policy.documento) && (
              <ResponsiblePersonCard policy={policy} />
            )}
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
              <p>
                Tem certeza que deseja excluir esta apólice?
              </p>
              <p className="text-xs">
                Esta ação não pode ser desfeita. Todos os dados relacionados, incluindo o arquivo PDF, serão permanentemente removidos.
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
