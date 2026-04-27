import React, { useId, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeltaStatus = 'ok' | 'insufficient' | 'baseline-zero';

interface SparklineProps {
  /** Pontos em ordem cronológica (mais antigo → mais recente). */
  data: number[];
  /** Variação percentual última vs. penúltima. `null` esconde o badge numérico. */
  deltaPct: number | null;
  /** Motivo do delta — controla o que aparece quando deltaPct é null. */
  deltaStatus?: DeltaStatus;
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
 * Visual:
 * - Linha principal (1.5px) + área preenchida com gradiente até transparente
 * - Cor segue a tendência: verde (alta), rosa (queda), cinza neutro (sem dado / flat)
 * - Quando há <2 pontos com valor real, renderiza placeholder neutro e exibe
 *   "Histórico insuficiente" no lugar de uma variação % inútil (ex.: +525.7%)
 */
export function Sparkline({
  data,
  deltaPct,
  deltaStatus = 'ok',
  invertColor = false,
  width = 84,
  height = 28,
  className,
  suffix = 'vs. mês ant.',
}: SparklineProps) {
  const gradientId = useId();

  const { linePath, areaPath, color, isFlat, hasShape } = useMemo(() => {
    // Considera "shape real" só quando há ≥2 pontos e ao menos um >0
    const usable = data && data.length >= 2 && data.some((v) => v > 0);
    if (!usable) {
      return {
        linePath: '',
        areaPath: '',
        color: 'hsl(var(--muted-foreground))',
        isFlat: true,
        hasShape: false,
      };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const flat = max === min;
    const range = flat ? 1 : max - min;
    const stepX = data.length === 1 ? 0 : width / (data.length - 1);

    const coords = data.map((v, i) => {
      const x = i * stepX;
      const y = flat
        ? height / 2
        : height - 2 - ((v - min) / range) * (height - 4);
      return { x, y };
    });

    const line = coords
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');

    const area =
      `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${height} ` +
      `L ${coords[0].x.toFixed(2)} ${height} Z`;

    // Cor: tendência efetiva considerando invertColor
    let strokeColor = 'hsl(var(--muted-foreground))';
    if (deltaPct !== null && !flat) {
      const isUp = deltaPct >= 0;
      const isGood = invertColor ? !isUp : isUp;
      // success token (verde Soft Fawn do projeto) com fallback
      strokeColor = isGood
        ? 'hsl(var(--success, 60 14% 50%))'
        : 'hsl(var(--destructive))';
    }

    return {
      linePath: line,
      areaPath: area,
      color: strokeColor,
      isFlat: flat,
      hasShape: true,
    };
  }, [data, deltaPct, invertColor, width, height]);

  // Sem histórico suficiente → não renderiza nada (esconde sparkline e badge)
  if (!hasShape || deltaStatus !== 'ok') {
    return null;
  }

  // Badge de variação
  const rounded = Math.round((deltaPct ?? 0) * 10) / 10;
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
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isFlat ? 0.5 : 1}
        />
      </svg>
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
    </div>
  );
}
