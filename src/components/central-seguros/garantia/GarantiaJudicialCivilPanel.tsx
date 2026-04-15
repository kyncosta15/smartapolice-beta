import { useState, useCallback } from 'react';
import { Loader2, Search, Plus, FileEdit, Send, FileText, Scale, RefreshCw, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteResult {
  quoteId?: number;
  proposalId?: number;
  documentNumber?: number;
  status?: string;
  premium?: number;
  insuredAmount?: number;
  [key: string]: any;
}

export function GarantiaJudicialCivilPanel() {
  const [activeTab, setActiveTab] = useState('consultar');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  // Consulta state
  const [consultaQuoteId, setConsultaQuoteId] = useState('');

  // Cotação state
  const [cotacaoForm, setCotacaoForm] = useState({
    policyholderFederalId: '',
    insuredFederalId: '',
    insuredAmount: '',
    durationStart: '',
    durationEnd: '',
    processNumber: '',
    courtName: '',
    modalityId: '',
    subModalityId: '',
    additionalInfo: '',
  });

  // Atualizar Cotação state
  const [updateQuoteId, setUpdateQuoteId] = useState('');

  // Minuta state
  const [minutaQuoteId, setMinutaQuoteId] = useState('');
  const [minutaPayload, setMinutaPayload] = useState('');

  // Emissão state
  const [emissaoQuoteId, setEmissaoQuoteId] = useState('');

  const handleCotacaoChange = (field: string, value: string) => {
    setCotacaoForm(prev => ({ ...prev, [field]: value }));
  };

  const invokeFunction = useCallback(async (action: string, extraBody: Record<string, any> = {}) => {
    setLoading(true);
    setResult(null);
    setRawResponse('');
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-judicial-civil', {
        body: { environment: 'sandbox', action, ...extraBody },
      });

      if (error) {
        toast.error('Erro na comunicação com a Edge Function');
        setRawResponse(JSON.stringify(error, null, 2));
        return;
      }

      setRawResponse(JSON.stringify(data, null, 2));

      if (data?.success) {
        setResult(data.data || data);
        toast.success('Operação realizada com sucesso!');
      } else {
        toast.error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConsultar = () => {
    if (!consultaQuoteId.trim()) {
      toast.error('Informe o ID da Cotação/Proposta/Emissão');
      return;
    }
    invokeFunction('getQuote', { quoteId: consultaQuoteId.trim() });
  };

  const handleCriarCotacao = () => {
    const { policyholderFederalId, insuredFederalId, insuredAmount, durationStart, durationEnd } = cotacaoForm;
    if (!policyholderFederalId || !insuredFederalId || !insuredAmount) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const payload: Record<string, any> = {
      policyholderFederalId: policyholderFederalId.replace(/\D/g, ''),
      insuredFederalId: insuredFederalId.replace(/\D/g, ''),
      insuredAmount: parseFloat(insuredAmount),
    };
    if (durationStart) payload.durationStart = durationStart;
    if (durationEnd) payload.durationEnd = durationEnd;
    if (cotacaoForm.processNumber) payload.processNumber = cotacaoForm.processNumber;
    if (cotacaoForm.courtName) payload.courtName = cotacaoForm.courtName;
    if (cotacaoForm.modalityId) payload.modalityId = parseInt(cotacaoForm.modalityId);
    if (cotacaoForm.subModalityId) payload.subModalityId = parseInt(cotacaoForm.subModalityId);
    if (cotacaoForm.additionalInfo) payload.additionalInfo = cotacaoForm.additionalInfo;

    invokeFunction('createQuote', { payload });
  };

  const handleAtualizarCotacao = () => {
    if (!updateQuoteId.trim()) {
      toast.error('Informe o ID da cotação para atualizar');
      return;
    }

    const payload: Record<string, any> = {
      quoteId: parseInt(updateQuoteId),
      policyholderFederalId: cotacaoForm.policyholderFederalId.replace(/\D/g, '') || undefined,
      insuredFederalId: cotacaoForm.insuredFederalId.replace(/\D/g, '') || undefined,
      insuredAmount: cotacaoForm.insuredAmount ? parseFloat(cotacaoForm.insuredAmount) : undefined,
    };
    if (cotacaoForm.durationStart) payload.durationStart = cotacaoForm.durationStart;
    if (cotacaoForm.durationEnd) payload.durationEnd = cotacaoForm.durationEnd;
    if (cotacaoForm.processNumber) payload.processNumber = cotacaoForm.processNumber;
    if (cotacaoForm.courtName) payload.courtName = cotacaoForm.courtName;
    if (cotacaoForm.additionalInfo) payload.additionalInfo = cotacaoForm.additionalInfo;

    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    invokeFunction('updateQuote', { payload });
  };

  const handleMinuta = () => {
    if (!minutaQuoteId.trim()) {
      toast.error('Informe o ID da cotação');
      return;
    }

    let payload = undefined;
    if (minutaPayload.trim()) {
      try {
        payload = JSON.parse(minutaPayload);
      } catch {
        toast.error('JSON da minuta inválido');
        return;
      }
    }

    invokeFunction('upsertMinuta', { quoteId: minutaQuoteId.trim(), payload });
  };

  const handleEmissao = () => {
    if (!emissaoQuoteId.trim()) {
      toast.error('Informe o ID da cotação');
      return;
    }
    invokeFunction('requestEmission', { quoteId: emissaoQuoteId.trim() });
  };

  const copyRaw = () => {
    navigator.clipboard.writeText(rawResponse);
    toast.success('JSON copiado!');
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="size-5" />
            Judicial Civil
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cotação, consulta, minuta e emissão de apólices Judicial Civil via API Junto Seguros.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="consultar" className="text-xs">
                <Search className="size-3 mr-1" />Consultar
              </TabsTrigger>
              <TabsTrigger value="criar" className="text-xs">
                <Plus className="size-3 mr-1" />Criar Cotação
              </TabsTrigger>
              <TabsTrigger value="atualizar" className="text-xs">
                <FileEdit className="size-3 mr-1" />Atualizar
              </TabsTrigger>
              <TabsTrigger value="minuta" className="text-xs">
                <FileText className="size-3 mr-1" />Minuta
              </TabsTrigger>
              <TabsTrigger value="emissao" className="text-xs">
                <Send className="size-3 mr-1" />Emissão
              </TabsTrigger>
            </TabsList>

            {/* ── CONSULTAR ── */}
            <TabsContent value="consultar" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>ID da Cotação / Proposta / Emissão</Label>
                  <Input
                    value={consultaQuoteId}
                    onChange={e => setConsultaQuoteId(e.target.value)}
                    placeholder="Ex: 123456"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleConsultar} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin mr-1" /> : <Search className="size-4 mr-1" />}
                    Consultar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── CRIAR COTAÇÃO ── */}
            <TabsContent value="criar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ/CPF Tomador *</Label>
                  <Input
                    value={cotacaoForm.policyholderFederalId}
                    onChange={e => handleCotacaoChange('policyholderFederalId', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <Label>CNPJ/CPF Segurado *</Label>
                  <Input
                    value={cotacaoForm.insuredFederalId}
                    onChange={e => handleCotacaoChange('insuredFederalId', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <Label>Importância Segurada (R$) *</Label>
                  <Input
                    type="number"
                    value={cotacaoForm.insuredAmount}
                    onChange={e => handleCotacaoChange('insuredAmount', e.target.value)}
                    placeholder="100000.00"
                  />
                </div>
                <div>
                  <Label>Nº Processo</Label>
                  <Input
                    value={cotacaoForm.processNumber}
                    onChange={e => handleCotacaoChange('processNumber', e.target.value)}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                </div>
                <div>
                  <Label>Início Vigência</Label>
                  <Input
                    type="date"
                    value={cotacaoForm.durationStart}
                    onChange={e => handleCotacaoChange('durationStart', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fim Vigência</Label>
                  <Input
                    type="date"
                    value={cotacaoForm.durationEnd}
                    onChange={e => handleCotacaoChange('durationEnd', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Vara / Tribunal</Label>
                  <Input
                    value={cotacaoForm.courtName}
                    onChange={e => handleCotacaoChange('courtName', e.target.value)}
                    placeholder="Ex: 1ª Vara Cível de Salvador"
                  />
                </div>
                <div>
                  <Label>Modalidade ID</Label>
                  <Select value={cotacaoForm.modalityId} onValueChange={v => handleCotacaoChange('modalityId', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="96">96 - Judicial Cível</SelectItem>
                      <SelectItem value="97">97 - Judicial Trabalhista</SelectItem>
                      <SelectItem value="98">98 - Judicial Tributária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Informações Adicionais</Label>
                <Textarea
                  value={cotacaoForm.additionalInfo}
                  onChange={e => handleCotacaoChange('additionalInfo', e.target.value)}
                  placeholder="Observações sobre o processo..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCriarCotacao} disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Criar Cotação
              </Button>
            </TabsContent>

            {/* ── ATUALIZAR COTAÇÃO ── */}
            <TabsContent value="atualizar" className="space-y-4">
              <div>
                <Label>ID da Cotação a Atualizar *</Label>
                <Input
                  value={updateQuoteId}
                  onChange={e => setUpdateQuoteId(e.target.value)}
                  placeholder="ID retornado na criação"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Os campos abaixo são os mesmos da criação. Preencha apenas os que deseja alterar.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ/CPF Tomador</Label>
                  <Input
                    value={cotacaoForm.policyholderFederalId}
                    onChange={e => handleCotacaoChange('policyholderFederalId', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <Label>CNPJ/CPF Segurado</Label>
                  <Input
                    value={cotacaoForm.insuredFederalId}
                    onChange={e => handleCotacaoChange('insuredFederalId', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <Label>Importância Segurada (R$)</Label>
                  <Input
                    type="number"
                    value={cotacaoForm.insuredAmount}
                    onChange={e => handleCotacaoChange('insuredAmount', e.target.value)}
                    placeholder="100000.00"
                  />
                </div>
                <div>
                  <Label>Nº Processo</Label>
                  <Input
                    value={cotacaoForm.processNumber}
                    onChange={e => handleCotacaoChange('processNumber', e.target.value)}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                </div>
              </div>
              <Button onClick={handleAtualizarCotacao} disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileEdit className="size-4 mr-2" />}
                Atualizar Cotação
              </Button>
            </TabsContent>

            {/* ── MINUTA ── */}
            <TabsContent value="minuta" className="space-y-4">
              <div>
                <Label>ID da Cotação *</Label>
                <Input
                  value={minutaQuoteId}
                  onChange={e => setMinutaQuoteId(e.target.value)}
                  placeholder="ID da cotação"
                />
              </div>
              <div>
                <Label>Payload da Minuta (JSON, opcional)</Label>
                <Textarea
                  value={minutaPayload}
                  onChange={e => setMinutaPayload(e.target.value)}
                  placeholder='{"clausulas": [...], "observacoes": "..."}'
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={handleMinuta} disabled={loading} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileText className="size-4 mr-2" />}
                Criar / Atualizar Minuta
              </Button>
            </TabsContent>

            {/* ── EMISSÃO ── */}
            <TabsContent value="emissao" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  <span className="text-sm font-medium">Atenção</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A solicitação de emissão é irreversível. Certifique-se de que a cotação e minuta estão corretas antes de prosseguir.
                </p>
              </div>
              <div>
                <Label>ID da Cotação *</Label>
                <Input
                  value={emissaoQuoteId}
                  onChange={e => setEmissaoQuoteId(e.target.value)}
                  placeholder="ID da cotação aprovada"
                />
              </div>
              <Button onClick={handleEmissao} disabled={loading} variant="default" className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                Solicitar Emissão
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── RESULTADO ── */}
      {(result || rawResponse) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Resultado
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={copyRaw} className="text-xs">
                <Copy className="size-3 mr-1" /> Copiar JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Structured result */}
            {result && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.quoteId && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Quote ID</p>
                    <p className="font-bold text-sm">{result.quoteId}</p>
                  </div>
                )}
                {result.proposalId && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Proposta ID</p>
                    <p className="font-bold text-sm">{result.proposalId}</p>
                  </div>
                )}
                {result.documentNumber && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Nº Documento</p>
                    <p className="font-bold text-sm">{result.documentNumber}</p>
                  </div>
                )}
                {result.status && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className="mt-1">{result.status}</Badge>
                  </div>
                )}
                {result.premium != null && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Prêmio</p>
                    <p className="font-bold text-sm">{formatCurrency(result.premium)}</p>
                  </div>
                )}
                {result.insuredAmount != null && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">IS</p>
                    <p className="font-bold text-sm">{formatCurrency(result.insuredAmount)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Ver JSON completo
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64 font-mono">
                {rawResponse}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
