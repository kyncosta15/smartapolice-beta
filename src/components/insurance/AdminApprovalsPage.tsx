import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Building2, Car } from 'lucide-react';
import { useInsuranceApprovals, InsuranceApprovalRequest } from '@/hooks/useInsuranceApprovals';
import { DecisionModal } from './DecisionModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminApprovalsPage() {
  const { requests, loading, approveRequest, rejectRequest } = useInsuranceApprovals();
  const [selectedRequest, setSelectedRequest] = useState<InsuranceApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const decidedRequests = requests.filter((r) => r.status !== 'pending');

  const handleDecision = async (requestId: string, type: 'approve' | 'reject', note?: string) => {
    if (type === 'approve') {
      await approveRequest(requestId, note);
    } else {
      await rejectRequest(requestId, note);
    }
    setSelectedRequest(null);
  };

  const renderRequestCard = (request: InsuranceApprovalRequest) => {
    const statusColors = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5" />
                {request.frota_veiculos?.placa || 'Sem placa'}
              </CardTitle>
              <CardDescription>
                {request.frota_veiculos?.marca} {request.frota_veiculos?.modelo}
              </CardDescription>
            </div>
            <Badge className={statusColors[request.status]}>
              {request.status === 'pending' && 'Pendente'}
              {request.status === 'approved' && 'Aprovada'}
              {request.status === 'rejected' && 'Rejeitada'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Empresa</p>
              <p className="font-medium flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {request.empresas?.nome || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Solicitado por</p>
              <p className="font-medium">{request.profiles?.display_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status Atual</p>
              <p className="font-medium">{request.current_status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status Solicitado</p>
              <p className="font-medium text-primary">{request.requested_status}</p>
            </div>
          </div>

          {request.motivo && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Motivo</p>
              <p className="text-sm bg-muted p-3 rounded-md">{request.motivo}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Solicitado em {format(new Date(request.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </div>

          {request.decision_note && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nota da Decisão</p>
              <p className="text-sm bg-muted p-3 rounded-md">{request.decision_note}</p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedRequest(request);
                  setDecisionType('reject');
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedRequest(request);
                  setDecisionType('approve');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovações de Seguros</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie solicitações de mudança de status de veículos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {requests.filter((r) => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {requests.filter((r) => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="decided">
            Decididas ({decidedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma solicitação pendente no momento.
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(renderRequestCard)
          )}
        </TabsContent>

        <TabsContent value="decided" className="space-y-4">
          {decidedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma solicitação decidida ainda.
              </CardContent>
            </Card>
          ) : (
            decidedRequests.map(renderRequestCard)
          )}
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <DecisionModal
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          request={selectedRequest}
          type={decisionType}
          onConfirm={(note) => handleDecision(selectedRequest.id, decisionType, note)}
        />
      )}
    </div>
  );
}
