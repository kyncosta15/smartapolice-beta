import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Heart, 
  Copy,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface ColaboradorFormSuccessPageProps {
  protocolo: string;
  nomeColaborador: string;
  onNewSubmission: () => void;
}

export const ColaboradorFormSuccessPage = ({ 
  protocolo, 
  nomeColaborador,
  onNewSubmission 
}: ColaboradorFormSuccessPageProps) => {
  
  const copyProtocolo = () => {
    navigator.clipboard.writeText(protocolo);
    toast.success('Protocolo copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">SmartBenefícios</h1>
            <p className="text-sm text-muted-foreground">Protocolo Gerado com Sucesso</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Protocolo Gerado!
              </CardTitle>
              <p className="text-muted-foreground">
                Olá <strong>{nomeColaborador}</strong>, suas informações foram recebidas com sucesso.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Protocolo */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Seu número de protocolo é:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-mono font-bold text-green-600">
                    {protocolo}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyProtocolo}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Guarde este número para acompanhar sua solicitação
                </p>
              </div>

              {/* Próximos passos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-3">O que acontece agora?</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Suas informações foram encaminhadas para o RH da empresa</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Em breve você será contatado com mais informações sobre seus benefícios</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Use o número do protocolo para consultar o status da sua solicitação</p>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Precisa de ajuda?</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>Entre em contato com o RH da sua empresa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>Ou envie um e-mail mencionando o protocolo: <strong>{protocolo}</strong></span>
                  </div>
                </div>
              </div>

              {/* Botão para nova submissão */}
              <div className="text-center pt-4">
                <Button 
                  onClick={onNewSubmission}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Fazer Nova Solicitação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};