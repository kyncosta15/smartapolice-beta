import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ColaboradorSubmissao } from '@/hooks/useSmartBeneficiosData';

interface ProtocolosDashboardProps {
  submissoes: ColaboradorSubmissao[];
  isLoading: boolean;
}

export const ProtocolosDashboard = ({ submissoes, isLoading }: ProtocolosDashboardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recebida':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Recebida</Badge>;
      case 'processada':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Processada</Badge>;
      case 'erro':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const protocolosRecentes = submissoes
    .filter(s => s.numero_protocolo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const estatisticas = {
    total: submissoes.filter(s => s.numero_protocolo).length,
    recebidas: submissoes.filter(s => s.status === 'recebida').length,
    processadas: submissoes.filter(s => s.status === 'processada').length,
    erros: submissoes.filter(s => s.status === 'erro').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Carregando protocolos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
                <p className="text-sm text-muted-foreground">Total de Protocolos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.recebidas}</p>
                <p className="text-sm text-muted-foreground">Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.processadas}</p>
                <p className="text-sm text-muted-foreground">Processadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.erros}</p>
                <p className="text-sm text-muted-foreground">Com Erro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Protocolos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Protocolos Gerados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {protocolosRecentes.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhum protocolo gerado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {protocolosRecentes.map((submissao) => (
                <Card key={submissao.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-blue-600">
                            {submissao.numero_protocolo}
                          </span>
                          {getStatusBadge(submissao.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {submissao.dados_preenchidos?.nome || 'Nome não informado'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(submissao.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>

                          {submissao.dados_preenchidos?.cpf && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                CPF: {submissao.dados_preenchidos.cpf}
                              </span>
                            </div>
                          )}
                        </div>

                        {submissao.observacoes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {submissao.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};