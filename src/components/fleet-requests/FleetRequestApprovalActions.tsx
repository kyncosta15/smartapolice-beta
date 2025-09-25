import React, { useState } from 'react';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { FleetChangeRequest } from '@/types/fleet-requests';

interface FleetRequestApprovalActionsProps {
  request: FleetChangeRequest;
  onUpdate: () => void;
}

export function FleetRequestApprovalActions({ 
  request, 
  onUpdate 
}: FleetRequestApprovalActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  // Verificar se usuário pode aprovar (admin/rh)
  const canApprove = user?.role && ['admin', 'administrador', 'rh', 'corretora_admin'].includes(user.role);

  if (!canApprove || !['aberto', 'em_triagem'].includes(request.status)) {
    return null;
  }

  const handleApprove = () => {
    setActionType('approve');
    setComments('');
    setActionModalOpen(true);
  };

  const handleReject = () => {
    setActionType('reject');
    setComments('');
    setActionModalOpen(true);
  };

  const processAction = async () => {
    try {
      setProcessing(true);

      const newStatus = actionType === 'approve' ? 'aprovado' : 'recusado';
      
      // Toast inicial com loading
      const loadingToast = toast({
        title: actionType === 'approve' ? 'Processando aprovação...' : 'Processando recusa...',
        description: 'Aguarde enquanto processamos sua solicitação',
        duration: 0, // Toast permanente até ser atualizado
      });
      
      // Chamar edge function para processar aprovação/rejeição
      const { data, error } = await supabase.functions.invoke('process-fleet-request-approval', {
        body: {
          requestId: request.id,
          action: actionType,
          comments,
          approvedBy: user?.id,
        }
      });

      if (error) throw error;

      // Fechar modal e atualizar
      setActionModalOpen(false);
      setComments('');
      onUpdate();

      // Toast de sucesso específico para aprovação
      if (actionType === 'approve') {
        // Se foi aprovado e é para inclusão de veículo, mostrar toast especial
        if (request.tipo.includes('inclusao') || request.tipo.includes('alteracao')) {
          toast({
            title: "🚗 Veículo Adicionado à Frota!",
            description: "Solicitação aprovada com sucesso.",
            action: (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Dispatch event para abrir modal do veículo
                  window.dispatchEvent(new CustomEvent('openVehicleModal', { 
                    detail: { 
                      placa: request.placa,
                      chassi: request.chassi,
                      requestId: request.id 
                    } 
                  }));
                }}
              >
                Ver Veículo
              </Button>
            ),
            duration: 8000,
          });
        } else {
          toast({
            title: '✅ Solicitação Aprovada',
            description: 'A alteração foi processada automaticamente no sistema',
            duration: 5000,
          });
        }
      } else {
        toast({
          title: '❌ Solicitação Recusada',
          description: 'O solicitante será notificado sobre a decisão',
          duration: 5000,
        });
      }

    } catch (error: any) {
      console.error('Erro ao processar aprovação:', error);
      toast({
        title: '⚠️ Erro ao processar',
        description: `Falha: ${error.message}`,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          variant="default"
          size="sm"
          className="gap-1"
          disabled={processing}
        >
          {processing && actionType === 'approve' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {processing && actionType === 'approve' ? 'Aprovando...' : 'Aprovar'}
        </Button>
        <Button
          onClick={handleReject}
          variant="destructive"
          size="sm"
          className="gap-1"
          disabled={processing}
        >
          {processing && actionType === 'reject' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {processing && actionType === 'reject' ? 'Recusando...' : 'Recusar'}
        </Button>
      </div>

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  Aprovar Solicitação
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-600" />
                  Recusar Solicitação
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Tipo:</strong> {request.tipo}</div>
                <div><strong>Veículo:</strong> {request.placa || request.chassi || 'N/A'}</div>
                <div><strong>Solicitante:</strong> {request.payload?.solicitante?.nome || 'N/A'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">
                Comentários {actionType === 'reject' ? '*' : '(opcional)'}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  actionType === 'approve' 
                    ? 'Comentários sobre a aprovação...'
                    : 'Motivo da recusa...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            {actionType === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  <strong>Atenção:</strong> Ao aprovar, a alteração será processada automaticamente no sistema.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setActionModalOpen(false)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                onClick={processAction}
                disabled={processing || (actionType === 'reject' && !comments.trim())}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                className="gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    {actionType === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}