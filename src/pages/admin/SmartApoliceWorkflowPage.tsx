import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Webhook,
  Code2,
  FileText,
  Bot,
  Braces,
  CheckCircle2,
  Upload,
  Loader2,
  XCircle,
  Database,
  Save,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SmartConfig = {
  system_prompt: string;
  openai_model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  merge_pages: boolean;
  max_pdf_mb: number;
  save_default: boolean;
  bucket_name: string;
  policy_number_prefix: string;
  default_status: string;
};

const DEFAULT_CONFIG: SmartConfig = {
  system_prompt: '',
  openai_model: 'gpt-4o',
  temperature: 0.3,
  top_p: 1,
  max_tokens: 4000,
  merge_pages: true,
  max_pdf_mb: 15,
  save_default: true,
  bucket_name: 'pdfs',
  policy_number_prefix: 'SA_',
  default_status: 'vigente',
};

type StepStatus = 'idle' | 'running' | 'success' | 'error';
type StepKey = 'webhook' | 'tratar' | 'extrair' | 'ai' | 'parametrizar' | 'salvar';

const STEP_LABELS: Record<StepKey, string> = {
  webhook: 'Webhook',
  tratar: 'Tratar PDF',
  extrair: 'Extrair texto de PDF',
  ai: 'AI Agent (gpt-4o)',
  parametrizar: 'Parametrização dos dados',
  salvar: 'Salvar / Retornar',
};

const ICONS: Record<StepKey, any> = {
  webhook: Webhook,
  tratar: Code2,
  extrair: FileText,
  ai: Bot,
  parametrizar: Braces,
  salvar: Database,
};

function WorkflowNode({ data }: NodeProps) {
  const Icon = (data.icon as any) ?? Webhook;
  const status = data.status as StepStatus;
  const ms = data.ms as number | undefined;

  const ringColor =
    status === 'running'
      ? 'ring-amber-400 animate-pulse'
      : status === 'success'
      ? 'ring-emerald-500'
      : status === 'error'
      ? 'ring-red-500'
      : 'ring-zinc-700';

  const iconColor =
    status === 'running'
      ? 'text-amber-400'
      : status === 'success'
      ? 'text-emerald-400'
      : status === 'error'
      ? 'text-red-400'
      : 'text-zinc-400';

  return (
    <div className="flex flex-col items-center gap-2">
      <Handle type="target" position={Position.Left} className="!bg-zinc-600 !border-0" />
      <div
        className={`relative h-16 w-16 rounded-2xl bg-zinc-900 ring-2 ${ringColor} flex items-center justify-center transition-all`}
      >
        <Icon className={`h-7 w-7 ${iconColor}`} />
        {status === 'running' && (
          <Loader2 className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-zinc-950 rounded-full" />
        )}
        {status === 'error' && (
          <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-500 bg-zinc-950 rounded-full" />
        )}
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-zinc-200 max-w-[120px]">{data.label as string}</div>
        {ms !== undefined && (
          <div className="text-[10px] text-zinc-500">{ms}ms</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-zinc-600 !border-0" />
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

const STEPS: StepKey[] = ['webhook', 'tratar', 'extrair', 'ai', 'parametrizar', 'salvar'];

export default function SmartApoliceWorkflowPage() {
  const [statuses, setStatuses] = useState<Record<StepKey, StepStatus>>(
    Object.fromEntries(STEPS.map((s) => [s, 'idle'])) as any,
  );
  const [times, setTimes] = useState<Partial<Record<StepKey, number>>>({});
  const [outputs, setOutputs] = useState<Record<string, any>>({});
  const [selectedStep, setSelectedStep] = useState<StepKey | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(() => {
    const nodes: Node[] = STEPS.map((key, i) => ({
      id: key,
      type: 'workflow',
      position: { x: 60 + i * 180, y: 80 },
      data: { label: STEP_LABELS[key], icon: ICONS[key], status: 'idle' as StepStatus },
    }));
    const edges: Edge[] = STEPS.slice(0, -1).map((s, i) => ({
      id: `e-${s}-${STEPS[i + 1]}`,
      source: s,
      target: STEPS[i + 1],
      animated: false,
      style: { stroke: '#52525b', strokeWidth: 2 },
    }));
    return { nodes, edges };
  }, []);

  const nodes: Node[] = useMemo(
    () =>
      initial.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: statuses[n.id as StepKey],
          ms: times[n.id as StepKey],
        },
      })),
    [initial.nodes, statuses, times],
  );

  const edges: Edge[] = useMemo(
    () =>
      initial.edges.map((e) => {
        const sourceDone = statuses[e.source as StepKey] === 'success';
        const targetRunning = statuses[e.target as StepKey] === 'running';
        return {
          ...e,
          animated: targetRunning,
          style: {
            stroke: sourceDone ? '#10b981' : '#52525b',
            strokeWidth: 2,
          },
        };
      }),
    [initial.edges, statuses],
  );

  const reset = () => {
    setStatuses(Object.fromEntries(STEPS.map((s) => [s, 'idle'])) as any);
    setTimes({});
    setOutputs({});
    setResult(null);
    setSelectedStep(null);
  };

  const handleRun = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Apenas arquivos PDF são aceitos');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('PDF deve ter no máximo 15MB');
      return;
    }

    reset();
    setRunning(true);

    // Animação progressiva: marca cada etapa como running em sequência
    // baseado no tempo médio estimado (será corrigido com tempos reais ao final)
    const runningSeq = async () => {
      for (const step of STEPS) {
        await new Promise((r) => setTimeout(r, 250));
        setStatuses((prev) =>
          prev[step] === 'idle' ? { ...prev, [step]: 'running' } : prev,
        );
      }
    };
    runningSeq();

    try {
      // Converte para base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);

      const { data, error } = await supabase.functions.invoke('smart-apolice-extract', {
        body: { filename: file.name, base64, save: true },
      });

      if (error || data?.error) {
        // Marca todas as running como erro
        const errMsg = error?.message || data?.error || 'Erro desconhecido';
        const partialSteps = data?.steps ?? {};
        setTimes(partialSteps);
        setOutputs(data?.outputs ?? {});
        setStatuses((prev) => {
          const next = { ...prev };
          let foundError = false;
          for (const s of STEPS) {
            if (partialSteps[s] !== undefined) next[s] = 'success';
            else if (!foundError) {
              next[s] = 'error';
              foundError = true;
            } else {
              next[s] = 'idle';
            }
          }
          return next;
        });
        toast.error(`Falhou: ${errMsg}`);
        return;
      }

      setTimes(data.steps);
      setOutputs(data.outputs);
      setStatuses(Object.fromEntries(STEPS.map((s) => [s, 'success'])) as any);
      setResult(data);
      toast.success(
        data.policy_id
          ? `Apólice salva (${data.total_ms}ms)`
          : `Extração ok (${data.total_ms}ms)`,
      );
    } catch (e: any) {
      toast.error(`Erro: ${e?.message ?? e}`);
      setStatuses((prev) => {
        const next = { ...prev };
        for (const s of STEPS) if (next[s] === 'running') next[s] = 'error';
        return next;
      });
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">SmartApólice — Workflow</h1>
            <p className="text-sm text-muted-foreground">
              Replicação nativa do fluxo n8n: upload de PDF → extração → IA → parametrização → banco.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} disabled={running}>
              Resetar
            </Button>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={running}
              className="gap-2"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Testar com PDF
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleRun(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm font-medium text-zinc-200">SmartApolice - PDF (Apolices)</span>
            </div>
            {result && (
              <Badge variant="outline" className="border-emerald-700 text-emerald-400">
                {result.total_ms}ms total
              </Badge>
            )}
          </div>
          <div style={{ height: 280 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={false}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => setSelectedStep(node.id as StepKey)}
            >
              <Background color="#27272a" gap={20} />
              <Controls showInteractive={false} className="!bg-zinc-900 !border-zinc-700" />
            </ReactFlow>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Output do nó</h3>
              {selectedStep && (
                <Badge variant="outline">{STEP_LABELS[selectedStep]}</Badge>
              )}
            </div>
            {selectedStep ? (
              <pre className="text-xs bg-muted/40 p-3 rounded max-h-96 overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(outputs[selectedStep] ?? null, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique em um nó do workflow para ver seu output.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Resultado final</h3>
            {result ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Policy ID</span>
                  <code className="text-xs">{result.policy_id ?? '—'}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segurado</span>
                  <span>{result.apolice?.segurado || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apólice nº</span>
                  <span>{result.apolice?.numero_apolice || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seguradora</span>
                  <span>{result.apolice?.seguradora || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prêmio</span>
                  <span>R$ {result.apolice?.premio?.toLocaleString('pt-BR') || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coberturas</span>
                  <span>{result.apolice?.coberturas?.length ?? 0}</span>
                </div>
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    JSON completo
                  </summary>
                  <pre className="text-xs bg-muted/40 p-3 rounded mt-2 max-h-64 overflow-auto">
                    {JSON.stringify(result.apolice, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Faça upload de um PDF para executar o workflow.
              </p>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
