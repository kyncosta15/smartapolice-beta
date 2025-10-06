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
  if (!duplicateInfo) return null;

  return (
    <AlertDialog open={!!duplicateInfo} onOpenChange={(open) => !open && onDismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Apólice Duplicada Detectada
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              A apólice <strong>{duplicateInfo.policyNumber}</strong> já existe no sistema.
            </p>
            <p>
              Os dados foram atualizados com as novas informações do arquivo enviado.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              A apólice atualizada está disponível na sua lista de apólices.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDismiss}>
            Não, continuar
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
