import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Crown, X, Plus } from 'lucide-react';
import { useCreateCaso, TIPO_CASO_LABELS } from '@/hooks/useConsultoria';

type Step = 1 | 2 | 3;

export default function ConsultoriaNovoCasoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const createCaso = useCreateCaso();

  // Step 1
  const [titulo, setTitulo] = useState('');
  const [tipoCaso, setTipoCaso] = useState('todos');
  const [cnpjs, setCnpjs] = useState<string[]>([]);
  const [cnpjInput, setCnpjInput] = useState('');

  // Step 2
  const [setor, setSetor] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [colaboradores, setColaboradores] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Step 3
  const [modoLayout, setModoLayout] = useState<'completo' | 'enxuto'>('completo');
  const [revisaoObrigatoria, setRevisaoObrigatoria] = useState(true);

  const addCnpj = () => {
    const v = cnpjInput.trim();
    if (v && !cnpjs.includes(v)) {
      setCnpjs([...cnpjs, v]);
      setCnpjInput('');
    }
  };

  const handleCreate = async () => {
    const caso = await createCaso.mutateAsync({
      titulo: titulo.trim(),
      tipo_caso: tipoCaso,
      modo_layout: modoLayout,
      cnpjs,
      revisao_obrigatoria: revisaoObrigatoria,
      perfil: {
        setor: setor.trim() || null,
        faturamento_anual: faturamento.trim() || null,
        colaboradores: colaboradores.trim() || null,
        observacoes: observacoes.trim() || null,
      },
    });
    navigate(`/consultoria-premium/${caso.id}`);
  };

  const canNext1 = titulo.trim().length >= 3;
  const canNext2 = true; // perfil é opcional

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/consultoria-premium')}>
            <ArrowLeft className="size-4" />
          </Button>
          <Crown className="size-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Novo caso de consultoria</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold mb-1">Identificação</h2>
                <p className="text-sm text-muted-foreground">
                  Título do caso e CNPJs envolvidos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título do caso *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex.: Parecer Grupo Assunção — 2026"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de análise</Label>
                <Select value={tipoCaso} onValueChange={setTipoCaso}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CASO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CNPJs (opcional — se for grupo empresarial)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpjInput}
                    onChange={(e) => setCnpjInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCnpj();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addCnpj}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                {cnpjs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cnpjs.map((c) => (
                      <Badge
                        key={c}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {c}
                        <button
                          onClick={() => setCnpjs(cnpjs.filter((x) => x !== c))}
                          className="hover:bg-background rounded-sm p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold mb-1">Perfil do cliente</h2>
                <p className="text-sm text-muted-foreground">
                  Quanto mais contexto, melhor o parecer da IA. Tudo opcional.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Setor de atuação</Label>
                  <Input
                    placeholder="Ex.: Indústria madeireira"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faturamento anual</Label>
                  <Input
                    placeholder="Ex.: R$ 15M"
                    value={faturamento}
                    onChange={(e) => setFaturamento(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nº de colaboradores</Label>
                  <Input
                    placeholder="Ex.: 120"
                    value={colaboradores}
                    onChange={(e) => setColaboradores(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações para a IA</Label>
                <Textarea
                  placeholder="Ex.: cliente tem frota pesada, opera em zona portuária, CCT da categoria exige capital mínimo de 24×..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold mb-1">Configuração do parecer</h2>
                <p className="text-sm text-muted-foreground">
                  Como o parecer será gerado e revisado.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Modo do layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoLayout('completo')}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      modoLayout === 'completo'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">Completo</div>
                    <div className="text-xs text-muted-foreground">
                      Layout fiel ao Parecer Assunção. Capa, blocos por produto,
                      lacunas, plano de ação.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoLayout('enxuto')}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      modoLayout === 'enxuto'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">Enxuto</div>
                    <div className="text-xs text-muted-foreground">
                      Resumo executivo + lacunas críticas. Para casos menores
                      ou retornos rápidos.
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="font-medium text-sm">Revisão humana obrigatória</div>
                  <div className="text-xs text-muted-foreground">
                    O parecer da IA exige aprovação antes de virar PDF final.
                  </div>
                </div>
                <Switch
                  checked={revisaoObrigatoria}
                  onCheckedChange={setRevisaoObrigatoria}
                />
              </div>
            </div>
          )}

          {/* Footer ações */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => (step > 1 ? setStep((step - 1) as Step) : navigate(-1))}
              disabled={createCaso.isPending}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((step + 1) as Step)}
                disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              >
                Avançar <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={createCaso.isPending}>
                {createCaso.isPending ? 'Criando...' : 'Criar caso'}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
