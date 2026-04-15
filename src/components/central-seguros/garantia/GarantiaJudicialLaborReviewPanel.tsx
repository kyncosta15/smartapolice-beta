import { useState, useCallback } from 'react';
import { Loader2, Search, Plus, FileEdit, Send, FileText, Briefcase, Copy, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ActiveView = 'home' | 'consultar' | 'criar' | 'atualizar' | 'minuta' | 'emissao';

export function GarantiaJudicialLaborReviewPanel() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState('');

  const [consultaQuoteId, setConsultaQuoteId] = useState('');
  const [cotacaoForm, setCotacaoForm] = useState({
    policyholderFederalId: '', insuredFederalId: '', insuredAmount: '',
    durationStart: '', durationEnd: '', processNumber: '',
    courtName: '', additionalInfo: '',
  });
  const [updateQuoteId, setUpdateQuoteId] = useState('');
  const [minutaQuoteId, setMinutaQuoteId] = useState('');
  const [minutaPayload, setMinutaPayload] = useState('');
  const [emissaoQuoteId, setEmissaoQuoteId] = useState('');

  const handleChange = (field: string, value: string) => {
    setCotacaoForm(prev => ({ ...prev, [field]: value }));
  };

  const invoke = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    setResult(null);
    setRawResponse('');
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-judicial-labor-review', {
        body: { environment: 'sandbox', action, ...extra },
      });
      if (error) { toast.error('Erro na comunicação'); setRawResponse(JSON.stringify(error, null, 2)); return; }
      setRawResponse(JSON.stringify(data, null, 2));
      if (data?.success) { setResult(data.data || data); toast.success('Operação realizada!'); }
      else toast.error(data?.error || 'Erro desconhecido');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  const handleConsultar = () => {
    if (!consultaQuoteId.trim()) return toast.error('Informe o ID');
    invoke('getQuote', { quoteId: consultaQuoteId.trim() });
  };

  const handleCriar = () => {
    const { policyholderFederalId, insuredFederalId, insuredAmount } = cotacaoForm;
    if (!policyholderFederalId || !insuredFederalId || !insuredAmount) return toast.error('Preencha os campos obrigatórios');
    const payload: Record<string, any> = {
      policyholderFederalId: policyholderFederalId.replace(/\D/g, ''),
      insuredFederalId: insuredFederalId.replace(/\D/g, ''),
      insuredAmount: parseFloat(insuredAmount),
    };
    if (cotacaoForm.durationStart) payload.durationStart = cotacaoForm.durationStart;
    if (cotacaoForm.durationEnd) payload.durationEnd = cotacaoForm.durationEnd;
    if (cotacaoForm.processNumber) payload.processNumber = cotacaoForm.processNumber;
    if (cotacaoForm.courtName) payload.courtName = cotacaoForm.courtName;
    if (cotacaoForm.additionalInfo) payload.additionalInfo = cotacaoForm.additionalInfo;
    invoke('createQuote', { payload });
  };

  const handleAtualizar = () => {
    if (!updateQuoteId.trim()) return toast.error('Informe o ID da cotação');
    const payload: Record<string, any> = { quoteId: parseInt(updateQuoteId) };
    if (cotacaoForm.policyholderFederalId) payload.policyholderFederalId = cotacaoForm.policyholderFederalId.replace(/\D/g, '');
    if (cotacaoForm.insuredFederalId) payload.insuredFederalId = cotacaoForm.insuredFederalId.replace(/\D/g, '');
    if (cotacaoForm.insuredAmount) payload.insuredAmount = parseFloat(cotacaoForm.insuredAmount);
    if (cotacaoForm.processNumber) payload.processNumber = cotacaoForm.processNumber;
    invoke('updateQuote', { payload });
  };

  const handleMinuta = () => {
    if (!minutaQuoteId.trim()) return toast.error('Informe o ID');
    let payload;
    if (minutaPayload.trim()) { try { payload = JSON.parse(minutaPayload); } catch { return toast.error('JSON inválido'); } }
    invoke('upsertMinuta', { quoteId: minutaQuoteId.trim(), payload });
  };

  const handleEmissao = () => {
    if (!emissaoQuoteId.trim()) return toast.error('Informe o ID');
    invoke('requestEmission', { quoteId: emissaoQuoteId.trim() });
  };

  const copyRaw = () => { navigator.clipboard.writeText(rawResponse); toast.success('JSON copiado!'); };
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (activeView === 'home') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Briefcase className="size-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Judicial Trabalhista (Labor Review)</h2>
            <p className="text-sm text-muted-foreground">Gerencie cotações, minutas e emissões trabalhistas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('consultar')}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Search className="size-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Consultar</h3>
              <p className="text-xs text-muted-foreground">Cotação, Proposta ou Emissão</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('criar')}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="size-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Cotar e Emitir</h3>
              <p className="text-xs text-muted-foreground">Nova cotação Trabalhista</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('atualizar')}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileEdit className="size-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Atualizar Cotação</h3>
              <p className="text-xs text-muted-foreground">Editar cotação existente</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('minuta')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileText className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Minuta</h3>
                <p className="text-xs text-muted-foreground">Criar ou atualizar minuta</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('emissao')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Solicitar Emissão</h3>
                <p className="text-xs text-muted-foreground">Emitir apólice trabalhista</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const BackButton = () => (
    <Button variant="ghost" size="sm" onClick={() => { setActiveView('home'); setResult(null); setRawResponse(''); }} className="mb-4">
      <ArrowLeft className="size-4 mr-1" /> Voltar
    </Button>
  );

  const ResultPanel = () => {
    if (!result && !rawResponse) return null;
    const extracted: Record<string, string> = {};
    if (result) {
      if (result.quoteId || result.id) extracted['ID'] = String(result.quoteId || result.id);
      if (result.proposalId) extracted['Proposta'] = String(result.proposalId);
      if (result.status) extracted['Status'] = result.status;
      if (result.premium) extracted['Prêmio'] = formatCurrency(result.premium);
      if (result.insuredAmount) extracted['IS'] = formatCurrency(result.insuredAmount);
      if (result.policyNumber) extracted['Apólice'] = result.policyNumber;
    }

    return (
      <div className="border rounded-lg p-4 space-y-3 mt-4">
        {Object.keys(extracted).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(extracted).map(([k, v]) => (
              <div key={k} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase">{k}</p>
                <p className="text-sm font-medium text-foreground">{v}</p>
              </div>
            ))}
          </div>
        )}
        {rawResponse && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver JSON completo
              <Button variant="ghost" size="sm" className="h-5 px-1 ml-auto" onClick={(e) => { e.stopPropagation(); copyRaw(); }}>
                <Copy className="size-3" />
              </Button>
            </summary>
            <pre className="mt-2 bg-muted/50 p-2 rounded text-[10px] overflow-auto max-h-48">{rawResponse}</pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <BackButton />

      {activeView === 'consultar' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Search className="size-4 text-primary" /> Consultar Judicial Trabalhista</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">ID da Cotação / Proposta</Label>
                <Input placeholder="Ex: 12345" value={consultaQuoteId} onChange={(e) => setConsultaQuoteId(e.target.value)} />
              </div>
              <Button onClick={handleConsultar} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4 mr-1" />} Buscar
              </Button>
            </div>
            <ResultPanel />
          </CardContent>
        </Card>
      )}

      {activeView === 'criar' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Plus className="size-4 text-primary" /> Nova Cotação Judicial Trabalhista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">CNPJ Tomador *</Label>
                <Input placeholder="00.000.000/0000-00" value={cotacaoForm.policyholderFederalId} onChange={(e) => handleChange('policyholderFederalId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CNPJ Segurado *</Label>
                <Input placeholder="00.000.000/0000-00" value={cotacaoForm.insuredFederalId} onChange={(e) => handleChange('insuredFederalId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Importância Segurada (IS) *</Label>
                <Input type="number" step="0.01" placeholder="Ex: 100000.00" value={cotacaoForm.insuredAmount} onChange={(e) => handleChange('insuredAmount', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nº do Processo</Label>
                <Input placeholder="Opcional" value={cotacaoForm.processNumber} onChange={(e) => handleChange('processNumber', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Início da Vigência</Label>
                <Input type="date" value={cotacaoForm.durationStart} onChange={(e) => handleChange('durationStart', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim da Vigência</Label>
                <Input type="date" value={cotacaoForm.durationEnd} onChange={(e) => handleChange('durationEnd', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vara / Tribunal</Label>
                <Input placeholder="Opcional" value={cotacaoForm.courtName} onChange={(e) => handleChange('courtName', e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Informações Adicionais</Label>
                <Textarea placeholder="Opcional" value={cotacaoForm.additionalInfo} onChange={(e) => handleChange('additionalInfo', e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCriar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />} Criar Cotação
            </Button>
            <ResultPanel />
          </CardContent>
        </Card>
      )}

      {activeView === 'atualizar' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><FileEdit className="size-4 text-primary" /> Atualizar Cotação</h3>
            <div className="space-y-1">
              <Label className="text-xs">ID da Cotação *</Label>
              <Input placeholder="Ex: 12345" value={updateQuoteId} onChange={(e) => setUpdateQuoteId(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">CNPJ Tomador</Label>
                <Input placeholder="Opcional" value={cotacaoForm.policyholderFederalId} onChange={(e) => handleChange('policyholderFederalId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CNPJ Segurado</Label>
                <Input placeholder="Opcional" value={cotacaoForm.insuredFederalId} onChange={(e) => handleChange('insuredFederalId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Importância Segurada (IS)</Label>
                <Input type="number" step="0.01" placeholder="Opcional" value={cotacaoForm.insuredAmount} onChange={(e) => handleChange('insuredAmount', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nº do Processo</Label>
                <Input placeholder="Opcional" value={cotacaoForm.processNumber} onChange={(e) => handleChange('processNumber', e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAtualizar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileEdit className="size-4 mr-2" />} Atualizar
            </Button>
            <ResultPanel />
          </CardContent>
        </Card>
      )}

      {activeView === 'minuta' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><FileText className="size-4 text-primary" /> Minuta</h3>
            <div className="space-y-1">
              <Label className="text-xs">ID da Cotação *</Label>
              <Input placeholder="Ex: 12345" value={minutaQuoteId} onChange={(e) => setMinutaQuoteId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payload JSON (opcional)</Label>
              <Textarea placeholder='{"campo": "valor"}' className="font-mono text-xs" rows={4} value={minutaPayload} onChange={(e) => setMinutaPayload(e.target.value)} />
            </div>
            <Button onClick={handleMinuta} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileText className="size-4 mr-2" />} Criar / Atualizar Minuta
            </Button>
            <ResultPanel />
          </CardContent>
        </Card>
      )}

      {activeView === 'emissao' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Solicitar Emissão</h3>
            <div className="space-y-1">
              <Label className="text-xs">ID da Cotação / Proposta *</Label>
              <Input placeholder="Ex: 12345" value={emissaoQuoteId} onChange={(e) => setEmissaoQuoteId(e.target.value)} />
            </div>
            <Button onClick={handleEmissao} disabled={loading} variant="destructive" className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />} Emitir Apólice
            </Button>
            <ResultPanel />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
