import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Clock, 
  User, 
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatSystem, ChatSession } from '@/hooks/useChatSystem';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatQueueProps {
  onSessionSelect: (session: ChatSession) => void;
}

export const ChatQueue: React.FC<ChatQueueProps> = ({ onSessionSelect }) => {
  const [sessions, setSessions] = useState<(ChatSession & { 
    colaborador_submissoes: { 
      dados_preenchidos: any;
      numero_protocolo: string;
    } 
  })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { acceptChatSession } = useChatSystem();

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          colaborador_submissoes!inner (
            dados_preenchidos,
            numero_protocolo,
            colaborador_links!inner (
              empresa_id,
              empresas!inner (
                nome
              )
            )
          )
        `)
        .in('status', ['aguardando', 'em_atendimento'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filtrar apenas sessões da empresa do usuário
      const filteredSessions = data?.filter(session => {
        const empresaNome = session.colaborador_submissoes?.colaborador_links?.empresas?.nome;
        return empresaNome === user?.company;
      }) || [];

      setSessions(filteredSessions as any);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      toast.error('Erro ao carregar fila de chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSession = async (session: ChatSession) => {
    if (!user?.id) return;
    
    await acceptChatSession(session.id, user.id);
    await fetchSessions();
    onSessionSelect(session);
  };

  useEffect(() => {
    fetchSessions();

    // Configurar realtime para atualizações da fila
    const channel = supabase
      .channel('chat_queue')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        fetchSessions();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'bg-yellow-500';
      case 'em_atendimento':
        return 'bg-green-500';
      case 'finalizado':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'Aguardando';
      case 'em_atendimento':
        return 'Em Atendimento';
      case 'finalizado':
        return 'Finalizado';
      case 'abandonado':
        return 'Abandonado';
      default:
        return status;
    }
  };

  const waitingSessions = sessions.filter(s => s.status === 'aguardando');
  const activeSessions = sessions.filter(s => s.status === 'em_atendimento');

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Na Fila</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
                <p className="text-sm text-muted-foreground">Em Atendimento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchSessions}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila de Espera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fila de Espera ({waitingSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[300px]">
            {waitingSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum chat na fila</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(session.status)}`} />
                      <div>
                        <p className="font-medium">
                          {session.colaborador_submissoes?.dados_preenchidos?.nome || 'Colaborador'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Protocolo: {session.colaborador_submissoes?.numero_protocolo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aguardando há {format(new Date(session.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getStatusLabel(session.status)}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptSession(session)}
                      >
                        Aceitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chats Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chats Ativos ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[300px]">
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum chat ativo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onSessionSelect(session)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(session.status)}`} />
                      <div>
                        <p className="font-medium">
                          {session.colaborador_submissoes?.dados_preenchidos?.nome || 'Colaborador'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Protocolo: {session.colaborador_submissoes?.numero_protocolo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Iniciado em {format(new Date(session.iniciado_em || session.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {getStatusLabel(session.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSessionSelect(session);
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};