import { useState, useCallback } from 'react';
import { Loader2, Search, Send, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GarantiaIncreaseValuePanel() {
  const [activeTab, setActiveTab] = useState('create');

  // Create
  const [createForm, setCreateForm] = useState({
    policyNumber: '', increaseInsuredAmount: '', durationStart: '', dueDateFirstInstallment: '', additionalInformation: '',
  });
  const [creating, setCreating] = useState(false);

  // Details
  const [detailsPn, setDetailsPn] = useState('');
  const [detailsId, setDetailsId] = useState('');
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Issue / Draft
  const [issuing, setIssuing] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('junto-garantia-increasevalue', { body: payload });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Erro na operação');
    return data;
  }, []);

  const handleCreate = useCallback(async () => {
    const { policyNumber, increaseInsuredAmount, durationStart } = createForm;
    if (!policyNumber || !increaseInsuredAmount || !durationStart) { toast.error('Preencha os campos obrigatórios'); return; }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'create', policyNumber,
        increaseInsuredAmount: Number(increaseInsuredAmount),
        durationStart: new Date(durationStart).toISOString(),
      };
      if (createForm.dueDateFirstInstallment) payload.dueDateFirstInstallment = new Date(createForm.dueDateFirstInstallment).toISOString();
      if (createForm.additionalInformation) payload.additionalInformation = createForm.additionalInformation;
      const res = await invoke(payload);
      toast.success(`Endosso criado! ID: ${res.data?.id || JSON.stringify(res.data)}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  }, [createForm, invoke]);

  const fetchDetails = useCallback(async () => {
    if (!detailsPn || !detailsId) { toast.error('Informe apólice e ID'); return; }
    setLoadingDetails(true);
    try {
      const res = await invoke({ action: 'details', policyNumber: detailsPn, id: Number(detailsId) });
      setDetails(res.data);
    } catch (err: any) { toast.error(err.message); setDetails(null); }
    finally { setLoadingDetails(false); }
  }, [detailsPn, detailsId, invoke]);

  const handleIssue = useCallback(async () => {
    if (!detailsPn || !detailsId) return;
    setIssuing(true);
    try {
      await invoke({ action: 'issue', policyNumber: detailsPn, id: Number(detailsId) });
      toast.success('Endosso emitido com sucesso!');
      fetchDetails();
    } catch (err: any) { toast.error(err.message); }
    finally { setIssuing(false); }
  }, [detailsPn, detailsId, invoke, fetchDetails]);

  const handleDraft = useCallback(async () => {
    if (!detailsPn || !detailsId) return;
    setDrafting(true);
    try {
      const res = await invoke({ action: 'draft', policyNumber: detailsPn, id: Number(detailsId) });
      toast.success('Minuta criada/atualizada!');
      if (res.data?.draftUrl) window.open(res.data.draftUrl, '_blank');
    } catch (err: any) { toast.error(err.message); }
    finally { setDrafting(false); }
  }, [detailsPn, detailsId, invoke]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Aumento de IS (Importância Segurada)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="create">Criar Endosso</TabsTrigger>
            <TabsTrigger value="details">Detalhes / Emissão</TabsTrigger>
          </TabsList>

          {/* Create */}
          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nº da Apólice Mãe *</Label>
                <Input placeholder="00-0000-0000000" value={createForm.policyNumber} onChange={(e) => setCreateForm({ ...createForm, policyNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor de Aumento (IS) *</Label>
                <Input type="number" step="0.01" placeholder="Ex: 50000.00" value={createForm.increaseInsuredAmount} onChange={(e) => setCreateForm({ ...createForm, increaseInsuredAmount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Início da Vigência *</Label>
                <Input type="date" value={createForm.durationStart} onChange={(e) => setCreateForm({ ...createForm, durationStart: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vencimento 1ª Parcela</Label>
                <Input type="date" value={createForm.dueDateFirstInstallment} onChange={(e) => setCreateForm({ ...createForm, dueDateFirstInstallment: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Informações Adicionais</Label>
                <Textarea placeholder="Opcional" value={createForm.additionalInformation} onChange={(e) => setCreateForm({ ...createForm, additionalInformation: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Criar Endosso de Aumento
            </Button>
          </TabsContent>

          {/* Details / Issue / Draft */}
          <TabsContent value="details" className="space-y-4">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label className="text-xs">Nº da Apólice</Label>
                <Input placeholder="00-0000-0000000" value={detailsPn} onChange={(e) => setDetailsPn(e.target.value)} />
              </div>
              <div className="w-32 space-y-1">
                <Label className="text-xs">ID Endosso</Label>
                <Input type="number" placeholder="ID" value={detailsId} onChange={(e) => setDetailsId(e.target.value)} />
              </div>
              <Button onClick={fetchDetails} disabled={loadingDetails} size="sm">
                {loadingDetails ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
              <Button onClick={handleDraft} disabled={drafting || !detailsId} variant="outline" size="sm">
                {drafting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                <span className="ml-1">Minuta</span>
              </Button>
              <Button onClick={handleIssue} disabled={issuing || !detailsId} variant="destructive" size="sm">
                {issuing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                <span className="ml-1">Emitir</span>
              </Button>
            </div>

            {details && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Endosso #{details.id as number}</h4>
                  {details.status && <Badge variant="outline">{String(details.status)}</Badge>}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver dados completos (JSON)</summary>
                  <pre className="mt-2 bg-muted/50 p-2 rounded text-[10px] overflow-auto max-h-48">{JSON.stringify(details, null, 2)}</pre>
                </details>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
