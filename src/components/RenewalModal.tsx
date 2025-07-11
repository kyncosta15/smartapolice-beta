
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { Calendar, AlertCircle } from 'lucide-react';

interface RenewalModalProps {
  policy: PolicyWithStatus;
  onDecision: (newStatus: PolicyStatus) => void;
  onClose: () => void;
}

export function RenewalModal({ policy, onDecision, onClose }: RenewalModalProps) {
  const expirationDate = new Date(policy.expirationDate).toLocaleDateString('pt-BR');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Renovação de Apólice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-gray-900">{policy.name}</h3>
            <p className="text-sm text-gray-600">{policy.insurer}</p>
            <div className="flex items-center gap-2 mt-2 text-orange-700">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                Venceu em: {expirationDate}
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-700 mb-6">
              Esta apólice está vencida. O que você deseja fazer?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => onDecision("aguardando_emissao")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Sim, quero renovar
              </Button>
              
              <Button 
                onClick={() => onDecision("nao_renovada")}
                variant="destructive"
                className="w-full"
              >
                Não desejo renovar
              </Button>
              
              <Button 
                onClick={() => onDecision("pendente_analise")}
                variant="secondary"
                className="w-full"
              >
                Em análise
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
