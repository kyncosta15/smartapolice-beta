import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatSession {
  id: string;
  submissao_id: string;
  usuario_atendente_id?: string;
  status: 'aguardando' | 'em_atendimento' | 'finalizado' | 'abandonado';
  iniciado_em: string;
  finalizado_em?: string;
  avaliacao?: number;
  comentario_avaliacao?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  remetente_tipo: 'colaborador' | 'usuario' | 'sistema';
  remetente_id?: string;
  remetente_nome: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'imagem' | 'arquivo' | 'sistema';
  metadata: Record<string, any>;
  lida: boolean;
  created_at: string;
}

export interface ChatAttachment {
  id: string;
  message_id: string;
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_tipo: string;
  arquivo_tamanho: number;
  created_at: string;
}

export const useChatSystem = (submissaoId?: string) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Criar sessão de chat
  const createChatSession = useCallback(async (submissionId: string) => {
    try {
      setIsLoading(true);
      
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('submissao_id', submissionId)
        .single();

      if (existingSession) {
        setSession(existingSession as ChatSession);
        return existingSession as ChatSession;
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          submissao_id: submissionId,
          status: 'aguardando'
        })
        .select()
        .single();

      if (error) throw error;

      setSession(data as ChatSession);
      
      // Enviar mensagem de sistema
      await sendSystemMessage(data.id, 'Chat iniciado. Aguarde um atendente...');
      
      return data as ChatSession;
    } catch (error) {
      console.error('Erro ao criar sessão de chat:', error);
      toast.error('Erro ao iniciar chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Aceitar sessão de chat (atendente)
  const acceptChatSession = useCallback(async (sessionId: string, atendenteId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'em_atendimento',
          usuario_atendente_id: atendenteId
        })
        .eq('id', sessionId);

      if (error) throw error;

      await sendSystemMessage(sessionId, 'Um atendente entrou no chat.');
      toast.success('Chat aceito com sucesso!');
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
      toast.error('Erro ao aceitar chat');
    }
  }, []);

  // Finalizar sessão
  const finalizeChatSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'finalizado',
          finalizado_em: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      await sendSystemMessage(sessionId, 'Chat finalizado.');
      toast.success('Chat finalizado');
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
      toast.error('Erro ao finalizar chat');
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    sessionId: string,
    conteudo: string,
    remetenteTipo: 'colaborador' | 'usuario',
    remetenteNome: string,
    remetenteId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          remetente_tipo: remetenteTipo,
          remetente_id: remetenteId,
          remetente_nome: remetenteNome,
          conteudo,
          tipo_mensagem: 'texto'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      return null;
    }
  }, []);

  // Enviar mensagem do sistema
  const sendSystemMessage = useCallback(async (sessionId: string, conteudo: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          remetente_tipo: 'sistema',
          remetente_nome: 'Sistema',
          conteudo,
          tipo_mensagem: 'sistema'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao enviar mensagem do sistema:', error);
    }
  }, []);

  // Upload de imagem
  const uploadImage = useCallback(async (file: File, sessionId: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      const fileName = `${sessionId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Buscar sessão existente
  const fetchChatSession = useCallback(async (submissionId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('submissao_id', submissionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSession((data as ChatSession) || null);
      return data as ChatSession;
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar mensagens
  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data as ChatMessage[]) || []);
      return data as ChatMessage[];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }, []);

  // Marcar mensagens como lidas
  const markAsRead = useCallback(async (sessionId: string, userId?: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ lida: true })
        .eq('session_id', sessionId)
        .neq('remetente_id', userId || '');

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  // Configurar realtime
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`chat_session_${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${session.id}`
      }, (payload) => {
        console.log('Nova mensagem recebida:', payload.new);
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${session.id}`
      }, (payload) => {
        console.log('Sessão atualizada:', payload.new);
        setSession(payload.new as ChatSession);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Inicializar chat se submissaoId fornecido
  useEffect(() => {
    if (submissaoId) {
      fetchChatSession(submissaoId);
    }
  }, [submissaoId, fetchChatSession]);

  return {
    session,
    messages,
    isLoading,
    isUploading,
    createChatSession,
    acceptChatSession,
    finalizeChatSession,
    sendMessage,
    sendSystemMessage,
    uploadImage,
    fetchChatSession,
    fetchMessages,
    markAsRead
  };
};