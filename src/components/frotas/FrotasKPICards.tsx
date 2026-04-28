import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { FrotaKPIs } from '@/hooks/useFrotasData';

interface FrotasKPICardsProps {
  kpis: FrotaKPIs;
  loading: boolean;
  hasData?: boolean;
  onResolveSemSeguro?: () => void;
  onViewVencimento?: () => void;
}

export function FrotasKPICards({
  kpis,
  loading,
  hasData = true,
  onResolveSemSeguro,
  onViewVencimento,
}: FrotasKPICardsProps) {
  const showSkeleton = loading || !hasData;

  if (showSkeleton) {
    return (
      <div className="mb-4 md:mb-6">
        <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 mb-3 uppercase">
          Versão refinada · Dashboard de Frotas
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="rounded-xl border-border/60 bg-card shadow-sm p-4 min-h-[140px] animate-pulse"
            >
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-9 w-20 bg-muted rounded mb-3" />
              <div className="h-2 w-full bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const safe = {
    totalVeiculos: kpis?.totalVeiculos ?? 0,
    semSeguro: kpis?.semSeguro ?? 0,
    veiculosSegurados: kpis?.veiculosSegurados ?? 0,
    proximoVencimento: kpis?.proximoVencimento ?? 0,
  };

  const total = safe.totalVeiculos || 1;
  const pctSegurados = Math.round((safe.veiculosSegurados / total) * 100);
  const pctSemSeguro = Math.max(0, 100 - pctSegurados);

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
          Dashboard de Frotas
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total de Veículos */}
        <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card shadow-sm hover:shadow-md transition-all p-4 min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Car className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-foreground">Total de Veículos</h3>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold leading-none tracking-tight text-foreground">
                {safe.totalVeiculos}
              </span>
              <span className="text-xs text-emerald-500 font-medium">cadastrados</span>
            </div>

            {/* Stacked progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${pctSegurados}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{ width: `${pctSemSeguro}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
              <span>{pctSegurados}% segurados</span>
              <span>{pctSemSeguro}% descobertos</span>
            </div>
          </div>
        </Card>

        {/* Sem Seguro - Action card */}
        <Card
          className={`relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all p-4 min-h-[140px] flex flex-col justify-between ${
            safe.semSeguro > 0
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-border/60 bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Sem Seguro</h3>
            </div>
            {safe.semSeguro > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold tracking-wider border-red-500/40 text-red-500 bg-red-500/10 px-1.5 py-0"
              >
                AÇÃO
              </Badge>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold leading-none tracking-tight text-red-500">
                {safe.semSeguro}
              </span>
              <span className="text-xs text-muted-foreground">de {safe.totalVeiculos}</span>
            </div>

            {safe.semSeguro > 0 && onResolveSemSeguro ? (
              <Button
                size="sm"
                onClick={onResolveSemSeguro}
                className="w-full h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
              >
                Resolver agora
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Tudo regularizado</p>
            )}
          </div>
        </Card>

        {/* Veículos Segurados */}
        <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card shadow-sm hover:shadow-md transition-all p-4 min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-medium text-foreground">Veículos Segurados</h3>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold leading-none tracking-tight text-foreground">
                {safe.veiculosSegurados}
              </span>
              <span className="text-xs text-muted-foreground">{pctSegurados}% da frota</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pctSegurados}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Próximo Vencimento */}
        <Card
          className="relative overflow-hidden rounded-xl border-border/60 bg-card shadow-sm hover:shadow-md transition-all p-4 min-h-[140px] flex flex-col justify-between cursor-pointer"
          onClick={onViewVencimento}
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-medium text-foreground">Próximo Vencimento</h3>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold leading-none tracking-tight text-foreground">
                {safe.proximoVencimento}
              </span>
              <span className="text-xs text-muted-foreground">em 30 dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {safe.proximoVencimento > 0
                ? 'Acompanhe as renovações'
                : 'Sem vencimentos próximos'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
