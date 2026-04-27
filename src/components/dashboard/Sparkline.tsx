import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  /** Pontos em ordem cronológica (mais antigo → mais recente). */
  data: number[];
  /** Variação percentual última vs. penúltima. `null` esconde o badge. */
  deltaPct: number | null;
  /** Se uma queda é "boa" (ex.: custos caindo). Default: false. */
  invertColor?: boolean;
  width?: number;
  height?: number;
  className?: string;
  /** Texto curto adicional após o %, ex.: "vs. mês ant.". */
  suffix?: string;
}

/**
 * Sparkline minimalista em SVG puro + indicador de variação %.
 *
 * Decisões de design:
 * - SVG inline (zero dependência) para manter o bundle leve
 * - Cores via tokens semânticos (success/destructive/muted) — respeita dark mode
 * - Quando há ≤1 ponto ou todos pontos iguais, renderiza linha plana neutra
 * - O badge de variação fica do lado direito, alinhado à baseline do número do KPI
 */
export function Sparkline({
  data,
  deltaPct,
  invertColor = false,
  width = 72,
  height = 24,
  className,
  suffix = 'vs. mês ant.',
}: SparklineProps) {
  const { path, stroke, isFlat } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', stroke: 'hsl(var(--muted-foreground))', isFlat: true };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const flat = max === min;
    const range = flat ? 1 : max - min;
    const stepX = data.length === 1 ? 0 : width / (data.length - 1);

    const points = data.map((v, i) => {
      const x = i * stepX;
      // Inverte o eixo Y (SVG cresce para baixo). Padding 2px top/bottom.
      const y = flat
        ? height / 2
        : height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    // Cor: positivo = success (#938F6F-ish via token), negativo = destructive
    let strokeColor = 'hsl(var(--muted-foreground))';
    if (deltaPct !== null && !flat) {
      const isUp = deltaPct >= 0;
      const isGood = invertColor ? !isUp : isUp;
      strokeColor = isGood ? 'hsl(var(--success, 60 14% 50%))' : 'hsl(var(--destructive))';
    }

    return {
      path: `M ${points.join(' L ')}`,
      stroke: strokeColor,
      isFlat: flat,
    };
  }, [data, deltaPct, invertColor, width, height]);

  // Badge de variação
  const renderDelta = () => {
    if (deltaPct === null) return null;
    const rounded = Math.round(deltaPct * 10) / 10;
    const isUp = rounded > 0;
    const isDown = rounded < 0;
    const isGood = invertColor ? isDown : isUp;
    const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

    const colorClass =
      rounded === 0
        ? 'text-muted-foreground'
        : isGood
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400';

    const sign = rounded > 0 ? '+' : '';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-[11px] font-semibold',
          colorClass
        )}
        title={`${sign}${rounded}% ${suffix}`}
        aria-label={`Variação ${sign}${rounded} por cento ${suffix}`}
      >
        <Icon className="size-3" aria-hidden />
        {sign}
        {Math.abs(rounded).toFixed(rounded % 1 === 0 ? 0 : 1)}%
      </span>
    );
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {data.length >= 2 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="shrink-0 overflow-visible"
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isFlat ? 0.5 : 1}
          />
        </svg>
      ) : (
        <div style={{ width, height }} aria-hidden />
      )}
      {renderDelta()}
    </div>
  );
}
