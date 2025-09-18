import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Car, 
  Shield, 
  Clock,
  Upload,
  Plus,
  CircleDot,
  Search,
  BadgeCheck,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { Claim, ClaimEvent, ClaimEventType, ClaimStatus } from '@/types/claims';
import { ClaimsService } from '@/services/claims';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClaimsDetailsDrawerProps {
  claim: Claim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClaimsDetailsDrawer({ claim, open, onOpenChange }: ClaimsDetailsDrawerProps) {
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (claim && open) {
      loadClaimEvents();
    }
  }, [claim, open]);

  const loadClaimEvents = async () => {
    if (!claim) return;
    
    setLoading(true);
    try {
      const claimEvents = await ClaimsService.getClaimEvents(claim.id);
      setEvents(claimEvents);
    } catch (error) {
      console.error('Error loading claim events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    const colors = {
      'aberto': 'bg-blue-100 text-blue-800 border-blue-200',
      'em_regulacao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'finalizado': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: ClaimStatus) => {
    const labels = {
      'aberto': 'Aberto',
      'em_regulacao': 'Em Regulação',
      'finalizado': 'Finalizado'
    };
    return labels[status] || status;
  };

  const getEventIcon = (tipo: ClaimEventType) => {
    const icons = {
      'abertura': CircleDot,
      'analise': Search,
      'documentacao': FileText,
      'regulacao': BadgeCheck,
      'pagamento': CreditCard,
      'encerramento': CheckCircle,
      'outro': CircleDot
    };
    return icons[tipo] || CircleDot;
  };

  const getEventColor = (tipo: ClaimEventType) => {
    const colors = {
      'abertura': 'text-blue-600',
      'analise': 'text-yellow-600',
      'documentacao': 'text-purple-600',
      'regulacao': 'text-orange-600',
      'pagamento': 'text-green-600',
      'encerramento': 'text-gray-600',
      'outro': 'text-gray-600'
    };
    return colors[tipo] || 'text-gray-600';
  };

  if (!claim) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {claim.ticket}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{claim.veiculo.placa}</p>
              <p className="text-sm text-muted-foreground">
                {claim.veiculo.marca} {claim.veiculo.modelo}
              </p>
            </div>
            <Badge className={getStatusColor(claim.status)}>
              {getStatusLabel(claim.status)}
            </Badge>
          </div>

          <Separator />

          {/* Apólice Relacionada */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Apólice Relacionada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {claim.apolice ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Número:</span>
                    <span className="font-medium">{claim.apolice.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Seguradora:</span>
                    <span className="font-medium">{claim.apolice.seguradora}</span>
                  </div>
                  {claim.apolice.vigencia_inicio && claim.apolice.vigencia_fim && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vigência:</span>
                      <span className="text-sm">
                        {new Date(claim.apolice.vigencia_inicio).toLocaleDateString()} - {' '}
                        {new Date(claim.apolice.vigencia_fim).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem apólice vinculada</p>
              )}
            </CardContent>
          </Card>

          {/* Veículo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Placa:</span>
                  <span className="font-medium">{claim.veiculo.placa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Marca/Modelo:</span>
                  <span className="font-medium">
                    {claim.veiculo.marca} {claim.veiculo.modelo}
                  </span>
                </div>
                {claim.veiculo.chassi && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Chassi:</span>
                    <span className="font-medium">{claim.veiculo.chassi}</span>
                  </div>
                )}
                {claim.veiculo.proprietario_nome && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Proprietário:</span>
                    <span className="font-medium">{claim.veiculo.proprietario_nome}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs para Esteira e Documentos */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Esteira</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline do Sinistro
                </h3>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="h-8 w-8 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event, index) => {
                      const Icon = getEventIcon(event.tipo);
                      const isLast = index === events.length - 1;
                      
                      return (
                        <div key={event.id} className="relative flex gap-3">
                          {/* Timeline Line */}
                          {!isLast && (
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-muted"></div>
                          )}
                          
                          {/* Event Icon */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-muted flex items-center justify-center ${getEventColor(event.tipo)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">
                              {event.tipo.replace('_', ' ')}
                            </p>
                            {event.descricao && (
                              <p className="text-sm text-muted-foreground">
                                {event.descricao}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.data), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </span>
                              {event.responsavel && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {event.responsavel}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento registrado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos
                </h3>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar
                </Button>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento anexado</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}