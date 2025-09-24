import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  User, 
  Car, 
  FileText, 
  Download,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { 
  FLEET_REQUEST_TIPOS, 
  FLEET_REQUEST_STATUS, 
  FLEET_REQUEST_PRIORIDADES 
} from '@/types/fleet-requests';
import type { FleetChangeRequest } from '@/types/fleet-requests';

interface FleetRequestDetailsModalProps {
  request: FleetChangeRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FleetRequestDetailsModal({ 
  request, 
  open, 
  onOpenChange 
}: FleetRequestDetailsModalProps) {
  const getTipoLabel = (tipo: string) => {
    const tipoConfig = FLEET_REQUEST_TIPOS.find(t => t.value === tipo);
    return tipoConfig?.label || tipo;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = FLEET_REQUEST_STATUS.find(s => s.value === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const variant = status === 'aprovado' || status === 'executado' ? 'default' :
                   status === 'recusado' ? 'destructive' :
                   status === 'em_triagem' ? 'secondary' : 'outline';

    return (
      <Badge variant={variant} className="gap-1">
        {status === 'aprovado' && <CheckCircle className="h-3 w-3" />}
        {status === 'recusado' && <XCircle className="h-3 w-3" />}
        {status === 'em_triagem' && <Clock className="h-3 w-3" />}
        {status === 'aberto' && <AlertCircle className="h-3 w-3" />}
        {statusConfig.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeConfig = FLEET_REQUEST_PRIORIDADES.find(p => p.value === prioridade);
    if (!prioridadeConfig) return <Badge variant="outline">{prioridade}</Badge>;

    const variant = prioridade === 'alta' ? 'destructive' :
                   prioridade === 'normal' ? 'default' : 'secondary';

    return <Badge variant={variant}>{prioridadeConfig.label}</Badge>;
  };

  const getShortId = (id: string) => {
    return id.substring(0, 8).toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Solicitação #{getShortId(request.id)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com status e prioridade */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                {getStatusBadge(request.status)}
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <div className="text-sm text-gray-500">Prioridade</div>
                {getPrioridadeBadge(request.prioridade)}
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <div className="text-sm text-gray-500">Tipo</div>
                <div className="font-medium">{getTipoLabel(request.tipo)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Criado em</div>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
          </div>

          {/* Informações do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5" />
                Identificação do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Placa</div>
                  <div className="font-mono font-medium">
                    {request.placa || <span className="text-gray-400">N/A</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Chassi</div>
                  <div className="font-mono text-sm">
                    {request.chassi || <span className="text-gray-400">N/A</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Renavam</div>
                  <div className="font-mono">
                    {request.renavam || <span className="text-gray-400">N/A</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivo/Justificativa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Motivo/Justificativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {request.payload?.motivo || 'Não informado'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Seguro */}
          {request.payload?.seguro && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Dados do Seguro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Seguradora</div>
                    <div className="font-medium">{request.payload.seguro.seguradora || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Número da Apólice</div>
                    <div className="font-mono">{request.payload.seguro.numero_apolice || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Início da Vigência</div>
                    <div>{request.payload.seguro.vigencia_inicio ? 
                      format(new Date(request.payload.seguro.vigencia_inicio), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fim da Vigência</div>
                    <div>{request.payload.seguro.vigencia_fim ? 
                      format(new Date(request.payload.seguro.vigencia_fim), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</div>
                  </div>
                  {request.payload.seguro.cobertura && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">Cobertura</div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {request.payload.seguro.cobertura}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados do Novo Responsável */}
          {request.payload?.responsavel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Novo Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Nome</div>
                    <div className="font-medium">{request.payload.responsavel.nome || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Telefone</div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {request.payload.responsavel.telefone || 'N/A'}
                    </div>
                  </div>
                  {request.payload.responsavel.email && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">E-mail</div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {request.payload.responsavel.email}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anexos */}
          {request.anexos && request.anexos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Anexos ({request.anexos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.anexos.map((anexo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{anexo.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(anexo.size)}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(anexo.url, '_blank')}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Solicitação criada</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    request.status !== 'aberto' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Status atual: {getTipoLabel(request.status)}</div>
                    <div className="text-xs text-gray-500">
                      Atualizado em {format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}