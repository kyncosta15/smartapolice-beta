import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { ChatInterface } from './chat/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProtocolChatButtonProps {
  submissaoId: string;
  protocolNumber: string;
  colaboradorNome: string;
}

interface ChatStatus {
  hasSession: boolean;
  status?: 'aguardando' | 'em_atendimento' | 'finalizado' | 'abandonado';
  sessionId?: string;
}

export const ProtocolChatButton: React.FC<ProtocolChatButtonProps> = ({
  submissaoId,
  protocolNumber,
  colaboradorNome
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>({ hasSession: false });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const checkChatStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, status')
        .eq('submissao_id', submissaoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar status do chat:', error);
        return;
      }

      if (data) {
        setChatStatus({
          hasSession: true,
          status: data.status as 'aguardando' | 'em_atendimento' | 'finalizado' | 'abandonado',
          sessionId: data.id
        });
      } else {
        setChatStatus({ hasSession: false });
      }
    } catch (error) {
      console.error('Erro ao verificar chat:', error);
    }
  };

  useEffect(() => {
    checkChatStatus();

    // Configurar realtime para atualizações de status
    const channel = supabase
      .channel(`protocol_chat_${submissaoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
        filter: `submissao_id=eq.${submissaoId}`
      }, () => {
        checkChatStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissaoId]);

  const getStatusInfo = () => {
    if (!chatStatus.hasSession) {
      return {
        label: 'Iniciar Chat',
        variant: 'default' as const,
        icon: MessageCircle,
        color: 'text-blue-600'
      };
    }

    switch (chatStatus.status) {
      case 'aguardando':
        return {
          label: 'Na Fila',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600'
        };
      case 'em_atendimento':
        return {
          label: 'Em Atendimento',
          variant: 'default' as const,
          icon: MessageCircle,
          color: 'text-green-600'
        };
      case 'finalizado':
        return {
          label: 'Chat Finalizado',
          variant: 'outline' as const,
          icon: CheckCircle,
          color: 'text-gray-600'
        };
      default:
        return {
          label: 'Chat',
          variant: 'default' as const,
          icon: MessageCircle,
          color: 'text-blue-600'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const canInitiateChat = !chatStatus.hasSession || 
    ['aguardando', 'em_atendimento'].includes(chatStatus.status || '');

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant={statusInfo.variant}
          size="sm"
          onClick={() => setIsOpen(true)}
          disabled={chatStatus.status === 'finalizado' || isLoading}
          className="flex items-center gap-2"
        >
          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
          {statusInfo.label}
        </Button>
        
        {chatStatus.hasSession && (
          <Badge 
            variant={
              chatStatus.status === 'aguardando' ? 'secondary' :
              chatStatus.status === 'em_atendimento' ? 'default' :
              chatStatus.status === 'finalizado' ? 'outline' :
              'secondary'
            }
            className="text-xs"
          >
            {chatStatus.status === 'aguardando' && 'Aguardando'}
            {chatStatus.status === 'em_atendimento' && 'Ativo'}
            {chatStatus.status === 'finalizado' && 'Finalizado'}
            {chatStatus.status === 'abandonado' && 'Abandonado'}
          </Badge>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat - Protocolo {protocolNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {canInitiateChat ? (
              <ChatInterface
                submissaoId={submissaoId}
                colaboradorNome={colaboradorNome}
                isPublic={false}
                onClose={() => setIsOpen(false)}
              />
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">Chat Finalizado</h3>
                <p className="text-muted-foreground">
                  Este chat foi finalizado. Para nova conversa, o colaborador precisa iniciar um novo chat.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};