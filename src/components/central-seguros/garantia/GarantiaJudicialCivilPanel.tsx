import { useState, useCallback } from 'react';
import { Loader2, Search, Plus, FileEdit, Send, FileText, Scale, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ActiveView = 'home' | 'consultar' | 'criar' | 'atualizar' | 'minuta' | 'emissao';

export function GarantiaJudicialCivilPanel() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState('');

  const [consultaQuoteId, setConsultaQuoteId] = useState('');
  const [cotacaoForm, setCotacaoForm] = useState({
    policyholderFederalId: '', insuredFederalId: '', insuredAmount: '',
    durationStart: '', durationEnd: '', processNumber: '',
    courtName: '', modalityId: '', additionalInfo: '',
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
      const { data, error } = await supabase.functions.invoke('junto-garantia-judicial-civil', {
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
    if (cotacaoForm.modalityId) payload.modalityId = parseInt(cotacaoForm.modalityId);
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

  // ── HOME VIEW ──
  if (activeView === 'home') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Scale className="size-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Judicial Civil</h2>
            <p className="text-sm text-muted-foreground">Gerencie cotações, minutas e emissões</p>
          </div>
        </div>

        {/* Action Cards */}
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
              <p className="text-xs text-muted-foreground">Nova cotação Judicial Civil</p>
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
                <h3 className="font-medium text-foreground text-sm">Minuta</h3>
                <p className="text-xs text-muted-foreground">Criar ou atualizar minuta</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setActiveView('emissao')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Send className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Solicitar Emissão</h3>
                <p className="text-xs text-muted-foreground">Emitir apólice aprovada</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── INNER VIEWS ──
  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => { setActiveView('home'); setResult(null); setRawResponse(''); }} className="mb-4 text-xs">
      ← Voltar
    </Button>
  );

  const resultPanel = (result || rawResponse) ? (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" /> Resultado</span>
          <Button variant="ghost" size="sm" onClick={copyRaw} className="text-xs h-7"><Copy className="size-3 mr-1" />Copiar</Button>
        </div>
        {result && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {result.quoteId && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">Quote ID</p><p className="font-bold text-sm">{result.quoteId}</p></div>}
            {result.proposalId && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">Proposta</p><p className="font-bold text-sm">{result.proposalId}</p></div>}
            {result.documentNumber && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">Documento</p><p className="font-bold text-sm">{result.documentNumber}</p></div>}
            {result.status && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">Status</p><Badge variant="outline" className="mt-0.5 text-xs">{result.status}</Badge></div>}
            {result.premium != null && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">Prêmio</p><p className="font-bold text-sm">{formatCurrency(result.premium)}</p></div>}
            {result.insuredAmount != null && <div className="p-2.5 border rounded-lg"><p className="text-[10px] text-muted-foreground">IS</p><p className="font-bold text-sm">{formatCurrency(result.insuredAmount)}</p></div>}
          </div>
        )}
        <details><summary className="cursor-pointer text-xs text-muted-foreground">JSON completo</summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 font-mono">{rawResponse}</pre>
        </details>
      </CardContent>
    </Card>
  ) : null;

  return (
    <div>
      {backButton}

      {activeView === 'consultar' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Search className="size-4" />Consultar Cotação / Proposta / Emissão</h3>
            <div className="flex gap-2">
              <Input value={consultaQuoteId} onChange={e => setConsultaQuoteId(e.target.value)} placeholder="ID da cotação, proposta ou emissão" className="max-w-xs" />
              <Button onClick={handleConsultar} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Consultar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'criar' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Plus className="size-4" />Nova Cotação Judicial Civil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">CNPJ/CPF Tomador *</Label><Input value={cotacaoForm.policyholderFederalId} onChange={e => handleChange('policyholderFederalId', e.target.value)} placeholder="00.000.000/0001-00" /></div>
              <div><Label className="text-xs">CNPJ/CPF Segurado *</Label><Input value={cotacaoForm.insuredFederalId} onChange={e => handleChange('insuredFederalId', e.target.value)} placeholder="00.000.000/0001-00" /></div>
              <div><Label className="text-xs">Importância Segurada (R$) *</Label><Input type="number" value={cotacaoForm.insuredAmount} onChange={e => handleChange('insuredAmount', e.target.value)} placeholder="100000.00" /></div>
              <div><Label className="text-xs">Nº Processo</Label><Input value={cotacaoForm.processNumber} onChange={e => handleChange('processNumber', e.target.value)} placeholder="0000000-00.0000.0.00.0000" /></div>
              <div><Label className="text-xs">Início Vigência</Label><Input type="date" value={cotacaoForm.durationStart} onChange={e => handleChange('durationStart', e.target.value)} /></div>
              <div><Label className="text-xs">Fim Vigência</Label><Input type="date" value={cotacaoForm.durationEnd} onChange={e => handleChange('durationEnd', e.target.value)} /></div>
              <div><Label className="text-xs">Vara / Tribunal</Label><Input value={cotacaoForm.courtName} onChange={e => handleChange('courtName', e.target.value)} placeholder="1ª Vara Cível" /></div>
              <div>
                <Label className="text-xs">Modalidade</Label>
                <Select value={cotacaoForm.modalityId} onValueChange={v => handleChange('modalityId', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="96">Judicial Cível</SelectItem>
                    <SelectItem value="97">Judicial Trabalhista</SelectItem>
                    <SelectItem value="98">Judicial Tributária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Observações</Label><Textarea value={cotacaoForm.additionalInfo} onChange={e => handleChange('additionalInfo', e.target.value)} rows={2} placeholder="Informações adicionais..." /></div>
            <Button onClick={handleCriar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}Criar Cotação
            </Button>
          </CardContent>
        </Card>
      )}

      {activeView === 'atualizar' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><FileEdit className="size-4" />Atualizar Cotação</h3>
            <div><Label className="text-xs">ID da Cotação *</Label><Input value={updateQuoteId} onChange={e => setUpdateQuoteId(e.target.value)} placeholder="ID retornado na criação" className="max-w-xs" /></div>
            <p className="text-xs text-muted-foreground">Preencha apenas os campos que deseja alterar:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">CNPJ/CPF Tomador</Label><Input value={cotacaoForm.policyholderFederalId} onChange={e => handleChange('policyholderFederalId', e.target.value)} /></div>
              <div><Label className="text-xs">CNPJ/CPF Segurado</Label><Input value={cotacaoForm.insuredFederalId} onChange={e => handleChange('insuredFederalId', e.target.value)} /></div>
              <div><Label className="text-xs">Importância Segurada (R$)</Label><Input type="number" value={cotacaoForm.insuredAmount} onChange={e => handleChange('insuredAmount', e.target.value)} /></div>
              <div><Label className="text-xs">Nº Processo</Label><Input value={cotacaoForm.processNumber} onChange={e => handleChange('processNumber', e.target.value)} /></div>
            </div>
            <Button onClick={handleAtualizar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileEdit className="size-4 mr-2" />}Atualizar
            </Button>
          </CardContent>
        </Card>
      )}

      {activeView === 'minuta' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><FileText className="size-4" />Criar / Atualizar Minuta</h3>
            <div><Label className="text-xs">ID da Cotação *</Label><Input value={minutaQuoteId} onChange={e => setMinutaQuoteId(e.target.value)} placeholder="ID da cotação" className="max-w-xs" /></div>
            <div><Label className="text-xs">Payload (JSON, opcional)</Label><Textarea value={minutaPayload} onChange={e => setMinutaPayload(e.target.value)} rows={4} className="font-mono text-xs" placeholder='{"clausulas": [...]}' /></div>
            <Button onClick={handleMinuta} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileText className="size-4 mr-2" />}Enviar Minuta
            </Button>
          </CardContent>
        </Card>
      )}

      {activeView === 'emissao' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Send className="size-4" />Solicitar Emissão</h3>
            <div className="p-3 border border-destructive/30 rounded-lg bg-destructive/5 flex items-start gap-2">
              <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">A solicitação de emissão é irreversível. Verifique a cotação e minuta antes de prosseguir.</p>
            </div>
            <div><Label className="text-xs">ID da Cotação *</Label><Input value={emissaoQuoteId} onChange={e => setEmissaoQuoteId(e.target.value)} placeholder="ID da cotação aprovada" className="max-w-xs" /></div>
            <Button onClick={handleEmissao} disabled={loading} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}Solicitar Emissão
            </Button>
          </CardContent>
        </Card>
      )}

      {resultPanel}
    </div>
  );
}
