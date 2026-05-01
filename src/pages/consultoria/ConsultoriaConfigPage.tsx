import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Crown, Save, Sparkles } from 'lucide-react';
import { useConsultoriaConfig, useUpdateConsultoriaConfig } from '@/hooks/useConsultoria';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConsultoriaConfigPage() {
  const navigate = useNavigate();
  const { data: config, isLoading } = useConsultoriaConfig();
  const update = useUpdateConsultoriaConfig();

  const [promptMestre, setPromptMestre] = useState('');
  const [tomVoz, setTomVoz] = useState('consultivo-tecnico');
  const [modeloParecer, setModeloParecer] = useState('rcaldas-padrao-v1');
  const [criteriosJson, setCriteriosJson] = useState('{}');
  const [criteriosError, setCriteriosError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setPromptMestre(config.prompt_mestre ?? '');
      setTomVoz(config.tom_voz ?? 'consultivo-tecnico');
      setModeloParecer(config.modelo_parecer ?? 'rcaldas-padrao-v1');
      setCriteriosJson(JSON.stringify(config.criterios ?? {}, null, 2));
    }
  }, [config]);

  const handleSave = () => {
    let parsed: any = {};
    try {
      parsed = JSON.parse(criteriosJson);
      setCriteriosError(null);
    } catch (e: any) {
      setCriteriosError('JSON inválido: ' + e.message);
      return;
    }
    update.mutate({
      prompt_mestre: promptMestre,
      tom_voz: tomVoz,
      modelo_parecer: modeloParecer,
      criterios: parsed,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/consultoria-premium')}>
              <ArrowLeft className="size-4" />
            </Button>
            <Crown className="size-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">Configurações da Consultoria</h1>
          </div>
          <Button onClick={handleSave} disabled={update.isPending} size="sm">
            <Save className="size-4 mr-2" />
            {update.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="size-5 text-primary mt-0.5" />
                <div>
                  <h2 className="font-semibold text-base">Prompt-mestre da IA</h2>
                  <p className="text-xs text-muted-foreground">
                    Instruções gerais que a IA seguirá ao analisar cada caso. Edite com cuidado:
                    define a estrutura, o tom e as regras do parecer.
                  </p>
                </div>
              </div>
              <Textarea
                value={promptMestre}
                onChange={(e) => setPromptMestre(e.target.value)}
                rows={18}
                className="font-mono text-xs leading-relaxed"
              />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5 space-y-2">
                <Label>Tom de voz</Label>
                <Input
                  value={tomVoz}
                  onChange={(e) => setTomVoz(e.target.value)}
                  placeholder="consultivo-tecnico"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador interno do estilo de escrita.
                </p>
              </Card>
              <Card className="p-5 space-y-2">
                <Label>Modelo de parecer</Label>
                <Input
                  value={modeloParecer}
                  onChange={(e) => setModeloParecer(e.target.value)}
                  placeholder="rcaldas-padrao-v1"
                />
                <p className="text-xs text-muted-foreground">
                  Versão do template visual usada na geração do PDF.
                </p>
              </Card>
            </div>

            <Card className="p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-base">Critérios de lacuna (JSON)</h2>
                <p className="text-xs text-muted-foreground">
                  Regras objetivas que a IA usa para identificar oportunidades. Pré-popular ado
                  com base no Parecer Assunção.
                </p>
              </div>
              <Textarea
                value={criteriosJson}
                onChange={(e) => setCriteriosJson(e.target.value)}
                rows={20}
                className="font-mono text-xs leading-relaxed"
              />
              {criteriosError && (
                <p className="text-xs text-destructive mt-2">{criteriosError}</p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
