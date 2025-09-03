import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmissionData {
  id: string;
  numero_protocolo: string;
  dados_preenchidos: any;
  status: string;
  colaborador_links: {
    titulo: string;
    descricao?: string;
  };
}

export const ColaboradorChatPage = () => {
  const { protocolNumber } = useParams<{ protocolNumber: string }>();
  const navigate = useNavigate();
  
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (protocolNumber) {
      fetchSubmissionData();
    }
  }, [protocolNumber]);

  const fetchSubmissionData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('colaborador_submissoes')
        .select(`
          *,
          colaborador_links (
            titulo,
            descricao
          )
        `)
        .eq('numero_protocolo', protocolNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Protocolo não encontrado. Verifique o número do protocolo.');
        } else {
          setError('Erro ao carregar dados do protocolo.');
        }
        return;
      }

      setSubmissionData(data as SubmissionData);

    } catch (err) {
      console.error('Erro ao buscar dados da submissão:', err);
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-blue-500 mb-4 animate-spin" />
            <p className="text-lg">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submissionData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">SmartBenefícios</h1>
            <p className="text-sm text-muted-foreground">
              Chat de Atendimento - Protocolo {submissionData.numero_protocolo}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Informações do Protocolo */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Protocolo Confirmado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número do Protocolo</p>
                  <p className="text-lg font-mono">{submissionData.numero_protocolo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p className="text-lg">{submissionData.dados_preenchidos?.nome || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assunto</p>
                  <p className="text-lg">{submissionData.colaborador_links?.titulo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg capitalize">{submissionData.status}</p>
                </div>
              </div>
              
              {submissionData.colaborador_links?.descricao && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                  <p className="text-sm">{submissionData.colaborador_links.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interface de Chat */}
          <div className="flex justify-center">
            <ChatInterface
              submissaoId={submissionData.id}
              colaboradorNome={submissionData.dados_preenchidos?.nome || 'Colaborador'}
              isPublic={true}
              onClose={() => navigate('/')}
            />
          </div>

          {/* Informações de Segurança */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Chat Seguro</p>
                  <p className="text-gray-600 mt-1">
                    Esta conversa utiliza conexão criptografada e é monitorada pela nossa equipe para garantir um atendimento de qualidade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};