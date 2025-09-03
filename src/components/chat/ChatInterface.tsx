import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Phone, 
  Star,
  MessageCircle,
  User,
  Bot
} from 'lucide-react';
import { useChatSystem, ChatMessage } from '@/hooks/useChatSystem';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatInterfaceProps {
  submissaoId: string;
  colaboradorNome: string;
  isPublic?: boolean;
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  submissaoId,
  colaboradorNome,
  isPublic = false,
  onClose
}) => {
  const [messageText, setMessageText] = useState('');
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    session,
    messages,
    isLoading,
    isUploading,
    createChatSession,
    sendMessage,
    finalizeChatSession,
    uploadImage,
    fetchMessages,
    markAsRead
  } = useChatSystem(submissaoId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session) {
      fetchMessages(session.id);
      markAsRead(session.id);
    }
  }, [session, fetchMessages, markAsRead]);

  const handleStartChat = async () => {
    await createChatSession(submissaoId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !session) return;

    const success = await sendMessage(
      session.id,
      messageText,
      isPublic ? 'colaborador' : 'usuario',
      colaboradorNome
    );

    if (success) {
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 5MB)');
      return;
    }

    const imageUrl = await uploadImage(file, session.id);
    if (imageUrl) {
      await sendMessage(
        session.id,
        `[IMAGEM] ${file.name}`,
        isPublic ? 'colaborador' : 'usuario',
        colaboradorNome
      );
    }
  };

  const handleEndChat = async () => {
    if (session && session.status === 'em_atendimento') {
      setShowRating(true);
    } else {
      onClose?.();
    }
  };

  const handleRatingSubmit = async () => {
    if (session && rating > 0) {
      await finalizeChatSession(session.id);
      setShowRating(false);
      onClose?.();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = isPublic 
      ? message.remetente_tipo === 'colaborador'
      : message.remetente_tipo === 'usuario';
    
    const isSystemMessage = message.remetente_tipo === 'sistema';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
            <Bot className="h-4 w-4 inline mr-2" />
            {message.conteudo}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : ''}`}>
          <div className={`p-3 rounded-lg ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <p className="text-sm">{message.conteudo}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          </p>
        </div>

        {isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {colaboradorNome[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (!session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Iniciar Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Inicie uma conversa com nossa equipe para esclarecer dúvidas sobre seu protocolo.
          </p>
          <Button 
            onClick={handleStartChat} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Chat'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showRating) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Avalie o Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Como você avalia o atendimento recebido?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant={rating >= star ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRating(star)}
              >
                <Star className={`h-4 w-4 ${rating >= star ? 'fill-current' : ''}`} />
              </Button>
            ))}
          </div>
          <Button 
            onClick={handleRatingSubmit}
            disabled={rating === 0}
            className="w-full"
          >
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat de Atendimento
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              session.status === 'aguardando' ? 'bg-yellow-500' :
              session.status === 'em_atendimento' ? 'bg-green-500' :
              'bg-gray-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {session.status === 'aguardando' ? 'Aguardando' :
               session.status === 'em_atendimento' ? 'Em atendimento' :
               'Finalizado'}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleEndChat}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};