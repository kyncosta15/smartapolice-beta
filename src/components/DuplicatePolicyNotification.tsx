import { useState } from 'react';
import { toast } from 'sonner';
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

interface DuplicatePolicyData {
  policyNumber: string;
  policyId: string;
  policyName: string;
}

interface DuplicatePolicyNotificationProps {
  duplicateInfo: DuplicatePolicyData | null;
  onView: () => void;
  onDismiss: () => void;
}

export function DuplicatePolicyNotification({
  duplicateInfo,
  onView,
  onDismiss,
}: DuplicatePolicyNotificationProps) {
  console.log('🔍 DuplicatePolicyNotification renderizado com:', duplicateInfo);
  
  if (!duplicateInfo) {
    console.log('⚠️ duplicateInfo é null, não renderizando modal');
    return null;
  }

  console.log('✅ Renderizando modal de duplicata!');

  return (
    <AlertDialog open={!!duplicateInfo} onOpenChange={(open) => {
      console.log('📋 Modal mudou estado:', open);
      if (!open) onDismiss();
    }}>
      <AlertDialogContent className="z-[100] max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <span className="text-3xl">⚠️</span>
            </div>
            <span>Apólice Duplicada Detectada</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-base">
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
              <p className="font-medium text-amber-900">
                A apólice <strong className="text-amber-700">{duplicateInfo.policyNumber}</strong> já existe no sistema.
              </p>
            </div>
            <p className="text-gray-700">
              Os dados foram <strong>atualizados</strong> com as novas informações do arquivo enviado.
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ A apólice atualizada está disponível na sua lista de apólices.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onDismiss} className="mt-0">
            Fechar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onView}
            className="bg-primary hover:bg-primary/90"
          >
            Ok, entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
