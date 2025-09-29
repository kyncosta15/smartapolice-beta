
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import { useProgressToast } from '@/hooks/use-progress-toast';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { progressToast } = useProgressToast();

  const handleShowSuccessToast = () => {
    progressToast({
      title: "Veículo atualizado com sucesso!",
      variant: "success",
      duration: 5000,
    });
    onClose();
  };

  const handleShowErrorToast = () => {
    progressToast({
      title: "Erro ao processar solicitação",
      variant: "error", 
      duration: 5000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Renovação Solicitada
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <p className="text-green-800 font-medium">
              Seu pedido de renovação foi enviado à seguradora.
            </p>
            <p className="text-green-700 text-sm mt-2">
              Em até <strong>15 dias</strong> sua apólice será reemitida.
            </p>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
