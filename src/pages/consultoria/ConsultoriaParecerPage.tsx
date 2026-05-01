import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useConsultoriaParecer } from '@/hooks/useConsultoria';
import { Skeleton } from '@/components/ui/skeleton';

const SEVERIDADE_META: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  alta: {
    label: 'Crítica',
    color: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: AlertTriangle,
  },
  media: {
    label: 'Atenção',
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
  },
  baixa: {
    label: 'Observação',
    color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: CheckCircle2,
  },
};

const PRODUTO_LABELS: Record<string, string> = {
  rcredi: 'Rcredi (Consórcios)',
  vida: 'Vida em Grupo',
  saude: 'Saúde',
  frota: 'Frota',
  patrimonial: 'Patrimonial',
  rc: 'Responsabilidade Civil',
  financiamento: 'Financiamentos',
  outro: 'Outros',
};

const formatBRL = (v: number | null | undefined) =>
  typeof v === 'number'
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';

export default function ConsultoriaParecerPage() {
  const { parecerId } = useParams<{ parecerId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useConsultoriaParecer(parecerId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data?.parecer) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground">Parecer não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/consultoria-premium')}>
          Voltar
        </Button>
      </div>
    );
  }

  const { parecer, lacunas } = data;
  const blocos: any[] = parecer.estrutura?.blocos ?? [];
  const planoAcao: any[] = parecer.estrutura?.plano_acao ?? [];

  const lacunasCriticas = lacunas.filter((l) => l.severidade === 'alta').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/consultoria-premium/${parecer.caso_id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <Crown className="size-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">
              Parecer Técnico — versão {parecer.versao}
            </h1>
            <p className="text-xs text-muted-foreground">
              Gerado por IA · {parecer.ia_modelo} ·{' '}
              {new Date(parecer.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {parecer.status.replace('_', ' ')}
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <TrendingDown className="size-3.5" /> Economia anual estimada
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatBRL(parecer.economia_anual_estimada)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <TrendingUp className="size-3.5" /> Capital de oportunidade
            </div>
            <div className="text-2xl font-bold tracking-tight text-primary">
              {formatBRL(parecer.oportunidade_capitalizacao_total)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <AlertTriangle className="size-3.5" /> Lacunas críticas
            </div>
            <div className="text-2xl font-bold tracking-tight text-destructive">
              {lacunasCriticas}
              <span className="text-base text-muted-foreground font-normal ml-2">
                de {lacunas.length}
              </span>
            </div>
          </Card>
        </div>

        {/* Resumo executivo */}
        {parecer.resumo_executivo && (
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="size-5 text-primary mt-0.5" />
              <h2 className="font-semibold text-base">Sumário executivo</h2>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {parecer.resumo_executivo}
            </p>
          </Card>
        )}

        {/* Blocos por produto */}
        {blocos.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Análise por produto
            </h2>
            {blocos.map((b, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-semibold">{b.titulo}</h3>
                  <Badge variant="secondary" className="capitalize">
                    {PRODUTO_LABELS[b.produto] ?? b.produto}
                  </Badge>
                </div>
                {b.resumo && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
                    {b.resumo}
                  </p>
                )}
                {Array.isArray(b.dados_chave) && b.dados_chave.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
                    {b.dados_chave.map((d: any, idx: number) => (
                      <div key={idx}>
                        <div className="text-xs text-muted-foreground mb-0.5">{d.rotulo}</div>
                        <div className="text-sm font-medium">{d.valor}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </section>
        )}

        {/* Lacunas */}
        {lacunas.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Lacunas identificadas
            </h2>
            {lacunas.map((l) => {
              const meta = SEVERIDADE_META[l.severidade] ?? SEVERIDADE_META.media;
              const Icon = meta.icon;
              return (
                <Card key={l.id} className={`p-5 border-l-4 ${meta.color.split(' ')[2] ?? ''}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{l.titulo}</h3>
                        <div className="flex gap-1.5 shrink-0">
                          <Badge variant="outline" className={meta.color}>
                            {meta.label}
                          </Badge>
                          {typeof l.valor_estimado === 'number' && l.valor_estimado > 0 && (
                            <Badge variant="secondary">{formatBRL(l.valor_estimado)}</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {PRODUTO_LABELS[l.categoria] ?? l.categoria}
                      </Badge>
                      {l.descricao && (
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                          {l.descricao}
                        </p>
                      )}
                      {l.recomendacao && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <span className="font-medium">Recomendação: </span>
                          {l.recomendacao}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        )}

        {/* Plano de ação */}
        {planoAcao.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Plano de ação
            </h2>
            <Card className="p-5 divide-y divide-border">
              {planoAcao.map((p: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 shrink-0">
                    <Calendar className="size-4 text-primary mb-0.5" />
                    <span className="text-xs font-bold text-primary">{p.prazo_dias}d</span>
                  </div>
                  <p className="text-sm pt-2 leading-relaxed flex-1">{p.acao}</p>
                </div>
              ))}
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
