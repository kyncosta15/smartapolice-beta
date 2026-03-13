import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Building2, Car, Loader2 } from 'lucide-react';
import { useInsuranceApprovals, InsuranceApprovalRequest } from '@/hooks/useInsuranceApprovals';
import { DecisionModal } from './DecisionModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminApprovalsPage() {
  const { requests, loading, approveRequest, rejectRequest } = useInsuranceApprovals();
  const [selectedRequest, setSelectedRequest] = useState<InsuranceApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (items: InsuranceApprovalRequest[]) => {
    const allSelected = items.every(r => selectedIds.has(r.id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        items.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        items.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        action === 'approve'
          ? approveRequest(id, `Aprovação em massa`)
          : rejectRequest(id, `Rejeição em massa`)
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedPendingCount = pendingRequests.filter(r => selectedIds.has(r.id)).length;

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-yellow-500 text-xs">Pendente</Badge>;
    if (status === 'approved') return <Badge className="bg-green-500 text-xs">Aprovada</Badge>;
    return <Badge className="bg-red-500 text-xs">Rejeitada</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-1/3" /></CardHeader>
              <CardContent><div className="space-y-2"><div className="h-4 bg-muted rounded w-full" /><div className="h-4 bg-muted rounded w-2/3" /></div></CardContent>
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
        <p className="text-muted-foreground mt-2">Gerencie solicitações de mudança de status de veículos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Aprovadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{requests.filter(r => r.status === 'approved').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Rejeitadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{requests.filter(r => r.status === 'rejected').length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="decided">Decididas ({decidedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Bulk actions bar */}
          {selectedPendingCount > 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPendingCount} selecionada(s)
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading}
                    onClick={() => handleBulkAction('reject')}
                  >
                    {bulkLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                    Rejeitar Selecionadas
                  </Button>
                  <Button
                    size="sm"
                    disabled={bulkLoading}
                    onClick={() => handleBulkAction('approve')}
                  >
                    {bulkLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Aprovar Selecionadas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma solicitação pendente no momento.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Table header */}
              <div className="rounded-lg border bg-card">
                <div className="hidden md:grid grid-cols-[40px_1fr_1fr_120px_120px_140px_120px] gap-2 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground items-center">
                  <div>
                    <Checkbox
                      checked={pendingRequests.length > 0 && pendingRequests.every(r => selectedIds.has(r.id))}
                      onCheckedChange={() => toggleSelectAll(pendingRequests)}
                    />
                  </div>
                  <div>Veículo</div>
                  <div>Empresa</div>
                  <div>Status Atual</div>
                  <div>Solicitado</div>
                  <div>Data</div>
                  <div className="text-right">Ações</div>
                </div>

                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_120px_120px_140px_120px] gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={() => toggleSelect(request.id)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{request.frota_veiculos?.placa || 'Sem placa'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.frota_veiculos?.marca} {request.frota_veiculos?.modelo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{request.empresas?.nome || 'N/A'}</span>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs">{request.current_status}</Badge>
                    </div>
                    <div>
                      <Badge className="bg-primary/10 text-primary text-xs">{request.requested_status}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(request.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setSelectedRequest(request); setDecisionType('reject'); }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => { setSelectedRequest(request); setDecisionType('approve'); }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
            <div className="rounded-lg border bg-card">
              <div className="hidden md:grid grid-cols-[1fr_1fr_120px_120px_140px_100px] gap-2 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground items-center">
                <div>Veículo</div>
                <div>Empresa</div>
                <div>Status Atual</div>
                <div>Solicitado</div>
                <div>Data</div>
                <div className="text-right">Decisão</div>
              </div>

              {decidedRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_120px_140px_100px] gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{request.frota_veiculos?.placa || 'Sem placa'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.frota_veiculos?.marca} {request.frota_veiculos?.modelo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{request.empresas?.nome || 'N/A'}</span>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs">{request.current_status}</Badge>
                  </div>
                  <div>
                    <Badge className="bg-primary/10 text-primary text-xs">{request.requested_status}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(request.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </div>
                  <div className="text-right">
                    {statusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
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
