import { useState, useCallback } from 'react';
import { Loader2, Search, XCircle, FileText, Send, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CancellationReason {
  id: number;
  description: string;
}

interface CancellationDetails {
  id: number;
  policyNumber?: string;
  status?: string;
  referenceCancellationDate?: string;
  endorsementNumber?: string;
  [key: string]: unknown;
}

export function GarantiaCancellationPanel() {
  const [activeTab, setActiveTab] = useState('create');

  // ─── Reasons state
  const [reasonsPolicyNumber, setReasonsPolicyNumber] = useState('');
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(false);

  // ─── Create state
  const [createForm, setCreateForm] = useState({
    policyNumber: '',
    referenceCancellationDate: '',
    reasonId: '',
    reasonInfo: '',
    additionalInformation: '',
    reemitPolicy: false,
    replacePolicyNumber: '',
  });
  const [creating, setCreating] = useState(false);

  // ─── Details/Issue state
  const [detailsId, setDetailsId] = useState('');
  const [details, setDetails] = useState<CancellationDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [issuing, setIssuing] = useState(false);

  // ─── All Process state
  const [allProcessForm, setAllProcessForm] = useState({
    policyNumber: '',
    referenceCancellationDate: '',
    reasonId: '',
    reasonInfo: '',
    additionalInformation: '',
  });
  const [creatingAll, setCreatingAll] = useState(false);

  const fetchReasons = useCallback(async () => {
    if (!reasonsPolicyNumber.trim()) {
      toast.error('Informe o número da apólice');
      return;
    }
    setLoadingReasons(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-cancellation', {
        body: { action: 'reasons', policyNumber: reasonsPolicyNumber.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar motivos');
      setReasons(Array.isArray(data.data) ? data.data : []);
      toast.success(`${(data.data || []).length} motivo(s) encontrado(s)`);
    } catch (err: any) {
      toast.error(err.message);
      setReasons([]);
    } finally {
      setLoadingReasons(false);
    }
  }, [reasonsPolicyNumber]);

  const handleCreate = useCallback(async () => {
    const { policyNumber, referenceCancellationDate, reasonId } = createForm;
    if (!policyNumber || !referenceCancellationDate || !reasonId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'create',
        policyNumber,
        referenceCancellationDate: new Date(referenceCancellationDate).toISOString(),
        reason: { id: Number(reasonId), additionalInformation: createForm.reasonInfo || undefined },
      };
      if (createForm.additionalInformation) payload.additionalInformation = createForm.additionalInformation;
      if (createForm.reemitPolicy) {
        payload.reemitPolicy = true;
        if (createForm.replacePolicyNumber) payload.replacePolicyNumber = createForm.replacePolicyNumber;
      }

      const { data, error } = await supabase.functions.invoke('junto-garantia-cancellation', { body: payload });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar cancelamento');
      toast.success(`Cancelamento criado! ID: ${data.data?.id || JSON.stringify(data.data)}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }, [createForm]);

  const fetchDetails = useCallback(async () => {
    if (!detailsId.trim()) {
      toast.error('Informe o ID do cancelamento');
      return;
    }
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-cancellation', {
        body: { action: 'details', id: Number(detailsId) },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar detalhes');
      setDetails(data.data);
    } catch (err: any) {
      toast.error(err.message);
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, [detailsId]);

  const handleIssue = useCallback(async () => {
    if (!detailsId.trim()) return;
    setIssuing(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-cancellation', {
        body: { action: 'issue', id: Number(detailsId) },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao emitir cancelamento');
      toast.success('Cancelamento emitido com sucesso!');
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIssuing(false);
    }
  }, [detailsId, fetchDetails]);

  const handleAllProcess = useCallback(async () => {
    const { policyNumber, referenceCancellationDate, reasonId } = allProcessForm;
    if (!policyNumber || !referenceCancellationDate || !reasonId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setCreatingAll(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'allProcess',
        policyNumber,
        referenceCancellationDate: new Date(referenceCancellationDate).toISOString(),
        reason: { id: Number(reasonId), additionalInformation: allProcessForm.reasonInfo || undefined },
      };
      if (allProcessForm.additionalInformation) payload.additionalInformation = allProcessForm.additionalInformation;

      const { data, error } = await supabase.functions.invoke('junto-garantia-cancellation', { body: payload });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar cancelamento completo');
      toast.success('Cancelamento de processo criado com sucesso!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingAll(false);
    }
  }, [allProcessForm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="size-5 text-destructive" />
          Cancelamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="create">Criar</TabsTrigger>
            <TabsTrigger value="details">Detalhes / Emissão</TabsTrigger>
            <TabsTrigger value="reasons">Motivos</TabsTrigger>
            <TabsTrigger value="allProcess">Cancelar Processo</TabsTrigger>
          </TabsList>

          {/* ─── Reasons Tab */}
          <TabsContent value="reasons" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Nº da Apólice</Label>
                <Input
                  placeholder="00-0000-0000000"
                  value={reasonsPolicyNumber}
                  onChange={(e) => setReasonsPolicyNumber(e.target.value)}
                />
              </div>
              <Button onClick={fetchReasons} disabled={loadingReasons}>
                {loadingReasons ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                <span className="ml-1">Buscar</span>
              </Button>
            </div>
            {reasons.length > 0 && (
              <div className="border rounded-lg divide-y">
                {reasons.map((r) => (
                  <div key={r.id} className="p-3 flex justify-between items-center">
                    <span className="text-sm">{r.description || `Motivo ${r.id}`}</span>
                    <Badge variant="outline">ID: {r.id}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Create Tab */}
          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nº da Apólice *</Label>
                <Input
                  placeholder="00-0000-0000000"
                  value={createForm.policyNumber}
                  onChange={(e) => setCreateForm({ ...createForm, policyNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Referência Cancelamento *</Label>
                <Input
                  type="date"
                  value={createForm.referenceCancellationDate}
                  onChange={(e) => setCreateForm({ ...createForm, referenceCancellationDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ID do Motivo *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  value={createForm.reasonId}
                  onChange={(e) => setCreateForm({ ...createForm, reasonId: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comentário do Motivo</Label>
                <Input
                  placeholder="Opcional"
                  value={createForm.reasonInfo}
                  onChange={(e) => setCreateForm({ ...createForm, reasonInfo: e.target.value })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Informações Adicionais</Label>
                <Textarea
                  placeholder="Detalhes adicionais (obrigatório se reemitir apólice)"
                  value={createForm.additionalInformation}
                  onChange={(e) => setCreateForm({ ...createForm, additionalInformation: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reemitPolicy"
                  checked={createForm.reemitPolicy}
                  onChange={(e) => setCreateForm({ ...createForm, reemitPolicy: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="reemitPolicy" className="text-xs">Reemitir apólice?</Label>
              </div>
              {createForm.reemitPolicy && (
                <div className="space-y-1">
                  <Label className="text-xs">Nº Apólice Substituta</Label>
                  <Input
                    placeholder="00-0000-0000000"
                    value={createForm.replacePolicyNumber}
                    onChange={(e) => setCreateForm({ ...createForm, replacePolicyNumber: e.target.value })}
                  />
                </div>
              )}
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Criar Cancelamento
            </Button>
          </TabsContent>

          {/* ─── Details / Issue Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">ID do Cancelamento</Label>
                <Input
                  type="number"
                  placeholder="Ex: 12345"
                  value={detailsId}
                  onChange={(e) => setDetailsId(e.target.value)}
                />
              </div>
              <Button onClick={fetchDetails} disabled={loadingDetails}>
                {loadingDetails ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                <span className="ml-1">Buscar</span>
              </Button>
              <Button onClick={handleIssue} disabled={issuing || !detailsId.trim()} variant="destructive">
                {issuing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                <span className="ml-1">Emitir</span>
              </Button>
            </div>

            {details && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Cancelamento #{details.id}</h4>
                  {details.status && <Badge variant="outline">{String(details.status)}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {details.policyNumber && (
                    <div><span className="font-medium text-foreground">Apólice:</span> {details.policyNumber}</div>
                  )}
                  {details.endorsementNumber && (
                    <div><span className="font-medium text-foreground">Endosso:</span> {details.endorsementNumber}</div>
                  )}
                  {details.referenceCancellationDate && (
                    <div><span className="font-medium text-foreground">Data Ref:</span> {details.referenceCancellationDate}</div>
                  )}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver dados completos (JSON)
                  </summary>
                  <pre className="mt-2 bg-muted/50 p-2 rounded text-[10px] overflow-auto max-h-48">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </TabsContent>

          {/* ─── All Process Tab */}
          <TabsContent value="allProcess" className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4 flex-shrink-0" />
              <span>Esta ação cancela todos os endossos da apólice de uma vez. Use com cuidado.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nº da Apólice *</Label>
                <Input
                  placeholder="00-0000-0000000"
                  value={allProcessForm.policyNumber}
                  onChange={(e) => setAllProcessForm({ ...allProcessForm, policyNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Referência *</Label>
                <Input
                  type="date"
                  value={allProcessForm.referenceCancellationDate}
                  onChange={(e) => setAllProcessForm({ ...allProcessForm, referenceCancellationDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ID do Motivo *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  value={allProcessForm.reasonId}
                  onChange={(e) => setAllProcessForm({ ...allProcessForm, reasonId: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comentário do Motivo</Label>
                <Input
                  placeholder="Opcional"
                  value={allProcessForm.reasonInfo}
                  onChange={(e) => setAllProcessForm({ ...allProcessForm, reasonInfo: e.target.value })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Informações Adicionais</Label>
                <Textarea
                  placeholder="Opcional"
                  value={allProcessForm.additionalInformation}
                  onChange={(e) => setAllProcessForm({ ...allProcessForm, additionalInformation: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAllProcess} disabled={creatingAll} variant="destructive" className="w-full">
              {creatingAll ? <Loader2 className="size-4 animate-spin mr-2" /> : <XCircle className="size-4 mr-2" />}
              Cancelar Processo Completo
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
