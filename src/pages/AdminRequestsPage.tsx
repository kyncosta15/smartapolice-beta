import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminApprovals } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ApprovalRequest } from '@/types/admin';

type StatusFilter = 'pending' | 'approved' | 'rejected';
type DecisionType = 'approve' | 'reject';

export default function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const { requests, loading, approveRequest, rejectRequest } = useAdminApprovals(statusFilter);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = async () => {
    if (!selectedRequest || !decisionType) return;

    setSubmitting(true);
    const success = decisionType === 'approve'
      ? await approveRequest(selectedRequest.id, decisionNote)
      : await rejectRequest(selectedRequest.id, decisionNote);

    setSubmitting(false);
    if (success) {
      setSelectedRequest(null);
      setDecisionType(null);
      setDecisionNote('');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <AdminLayout activeSection="approvals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Solicitações de Aprovação</h2>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="approved">Aprovadas</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'pending' && 'Solicitações Pendentes'}
              {statusFilter === 'approved' && 'Solicitações Aprovadas'}
              {statusFilter === 'rejected' && 'Solicitações Rejeitadas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma solicitação encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Status Atual</TableHead>
                      <TableHead>Status Solicitado</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Status</TableHead>
                      {statusFilter === 'pending' && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.empresa_nome}
                        </TableCell>
                        <TableCell>{request.placa}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.current_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{request.requested_status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.motivo}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        {statusFilter === 'pending' && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDecisionType('approve');
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDecisionType('reject');
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Dialog */}
      <Dialog
        open={!!selectedRequest && !!decisionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setDecisionType(null);
            setDecisionNote('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === 'approve' ? 'Aprovar' : 'Rejeitar'} Solicitação
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Veículo: <strong>{selectedRequest.placa}</strong> da empresa{' '}
                  <strong>{selectedRequest.empresa_nome}</strong>
                  <br />
                  Mudança: {selectedRequest.current_status} → {selectedRequest.requested_status}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Observações (opcional)</Label>
              <Textarea
                id="note"
                placeholder="Adicione observações sobre esta decisão..."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setDecisionType(null);
                setDecisionNote('');
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant={decisionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleDecision}
              disabled={submitting}
            >
              {submitting ? 'Processando...' : decisionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
