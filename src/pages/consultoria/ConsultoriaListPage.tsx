import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Plus, Settings, ArrowLeft } from 'lucide-react';
import { useConsultoriaCasos, STATUS_LABELS, CasoStatus } from '@/hooks/useConsultoria';
import { CasoCard } from '@/components/consultoria/CasoCard';
import { Skeleton } from '@/components/ui/skeleton';

const COLUMNS: CasoStatus[] = ['rascunho', 'em_analise', 'em_revisao', 'entregue'];

export default function ConsultoriaListPage() {
  const navigate = useNavigate();
  const { data: casos = [], isLoading } = useConsultoriaCasos();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crown className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Consultoria Premium</h1>
                <p className="text-xs text-muted-foreground">
                  Análise técnica de apólices, consórcios e financiamentos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/consultoria-premium/configuracoes')}
            >
              <Settings className="size-4 mr-2" /> Configurações
            </Button>
            <Button size="sm" onClick={() => navigate('/consultoria-premium/novo')}>
              <Plus className="size-4 mr-2" /> Novo caso
            </Button>
          </div>
        </div>
      </header>

      {/* Kanban */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : casos.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-20 text-center">
            <Crown className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <h2 className="text-base font-semibold mb-1">Nenhum caso ainda</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Comece criando seu primeiro caso de consultoria. Você poderá enviar PDFs
              do cliente e gerar pareceres no padrão Rcaldas.
            </p>
            <Button onClick={() => navigate('/consultoria-premium/novo')}>
              <Plus className="size-4 mr-2" /> Criar primeiro caso
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((status) => {
              const items = casos.filter((c) => c.status === status);
              const meta = STATUS_LABELS[status];
              return (
                <div key={status} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 min-h-[100px]">
                    {items.map((c) => (
                      <CasoCard key={c.id} caso={c} />
                    ))}
                    {items.length === 0 && (
                      <div className="border border-dashed border-border/60 rounded-lg p-4 text-center">
                        <span className="text-xs text-muted-foreground">vazio</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
