import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users, BarChart3 } from 'lucide-react';
import { ChatQueue } from './chat/ChatQueue';
import { ChatInterface } from './chat/ChatInterface';
import { ChatSession } from '@/hooks/useChatSystem';
import { useAuth } from '@/contexts/AuthContext';

export const ChatManagement = () => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const { user } = useAuth();

  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
  };

  const handleCloseChat = () => {
    setSelectedSession(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Gerenciamento de Chat
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fila de Atendimento
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat Ativo
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          <ChatQueue onSessionSelect={handleSessionSelect} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {selectedSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações da Sessão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Sessão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-lg capitalize">{selectedSession.status}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Protocolo</p>
                    <p className="text-lg font-mono">{selectedSession.submissao_id}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Iniciado em</p>
                    <p className="text-sm">
                      {new Date(selectedSession.iniciado_em || selectedSession.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {selectedSession.usuario_atendente_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Atendente</p>
                      <p className="text-sm">{user?.name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interface de Chat */}
              <div className="lg:col-span-2">
                <ChatInterface
                  submissaoId={selectedSession.submissao_id}
                  colaboradorNome={user?.name || 'Atendente'}
                  isPublic={false}
                  onClose={handleCloseChat}
                />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum Chat Selecionado</h3>
                <p className="text-muted-foreground">
                  Selecione um chat da fila para começar o atendimento
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Chats Hoje</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">Resolvidos</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground">Tempo Médio</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">0</div>
                  <div className="text-sm text-muted-foreground">Avaliação</div>
                </div>
              </div>
              
              <div className="mt-8 text-center text-muted-foreground">
                <p>Relatórios detalhados em desenvolvimento...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};