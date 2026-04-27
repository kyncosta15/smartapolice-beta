import React, { useState } from 'react';
import { FileText, Users, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VinculoModal } from './VinculoModal';
import type { ParsedPolicyData } from '@/utils/policyDataParser';

interface VinculoSegmentProps {
  count: number;
  onClick?: () => void;
}

export interface VinculoProps {
  pessoaFisica: VinculoSegmentProps;
  pessoaJuridica: VinculoSegmentProps;
  /** Opcional: quando fornecido, clicar em "Ver" abre um modal com a lista filtrada. */
  policies?: ParsedPolicyData[];
  className?: string;
}

interface SegmentCardProps {
  variant: 'pf' | 'pj';
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  count: number;
  percent: number;
  onClick?: () => void;
}

function SegmentCard({ variant, label, sublabel, Icon, count, percent, onClick }: SegmentCardProps) {
  const isEmpty = count === 0;
  const pluralized = count === 1 ? 'apólice' : 'apólices';

  // Token classes per variant
  const tokens = variant === 'pf'
    ? {
        bg: 'bg-pf-bg',
        bgHover: 'hover:bg-pf-bg-hover',
        border: 'border-pf-border',
        borderHover: 'hover:border-pf',
        text: 'text-pf',
        foreground: 'text-pf-foreground',
        ring: 'focus-visible:ring-pf',
        iconBg: 'bg-pf/15',
        divider: 'border-pf/15',
        badge: 'bg-pf/10 text-pf-foreground border-transparent',
        btnBorder: 'border-pf/30',
        btnHover: 'hover:bg-pf/10',
      }
    : {
        bg: 'bg-pj-bg',
        bgHover: 'hover:bg-pj-bg-hover',
        border: 'border-pj-border',
        borderHover: 'hover:border-pj',
        text: 'text-pj',
        foreground: 'text-pj-foreground',
        ring: 'focus-visible:ring-pj',
        iconBg: 'bg-pj/15',
        divider: 'border-pj/15',
        badge: 'bg-pj/10 text-pj-foreground border-transparent',
        btnBorder: 'border-pj/30',
        btnHover: 'hover:bg-pj/10',
      };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${label}: ${count} ${pluralized}, ${Math.round(percent)}% do total. Clique para ver detalhes.`}
      className={cn(
        'rounded-lg border p-3.5 cursor-pointer transition-all duration-200',
        'flex flex-col gap-2.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        tokens.bg,
        tokens.border,
        tokens.bgHover,
        tokens.borderHover,
        tokens.ring,
        isEmpty && 'opacity-60'
      )}
    >
      {/* Linha superior */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', tokens.iconBg)}>
            <Icon className={cn('h-4 w-4', tokens.text)} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-foreground leading-tight truncate">{label}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{sublabel}</div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[11px] font-medium px-1.5 py-0 h-5 shrink-0',
            isEmpty ? 'bg-muted text-muted-foreground border-transparent' : tokens.badge
          )}
        >
          {Math.round(percent)}%
        </Badge>
      </div>

      {/* Divisor */}
      <div className={cn('border-t', isEmpty ? 'border-border' : tokens.divider)} />

      {/* Linha inferior */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={cn('text-[22px] font-medium leading-none', isEmpty ? 'text-muted-foreground' : tokens.text)}>
            {count}
          </span>
          <span className="text-[11px] text-muted-foreground">{pluralized}</span>
        </div>
        {isEmpty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Ver
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className={cn('h-7 px-2 text-[11px] bg-transparent', tokens.text, tokens.btnBorder, tokens.btnHover)}
          >
            Ver
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function Vinculo({ pessoaFisica, pessoaJuridica, policies, className }: VinculoProps) {
  const [modalTipo, setModalTipo] = useState<'pf' | 'pj' | null>(null);

  const handlePf = () => {
    if (policies) setModalTipo('pf');
    else pessoaFisica.onClick?.();
  };
  const handlePj = () => {
    if (policies) setModalTipo('pj');
    else pessoaJuridica.onClick?.();
  };

  const total = pessoaFisica.count + pessoaJuridica.count;
  const pfPercent = total > 0 ? (pessoaFisica.count / total) * 100 : 0;
  const pjPercent = total > 0 ? (pessoaJuridica.count / total) * 100 : 0;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 sm:p-6 w-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-md bg-accent-icon-bg flex items-center justify-center shrink-0">
            <FileText className="h-3.5 w-3.5 text-accent-icon" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-foreground leading-tight">Vínculo</div>
            <div className="text-[12px] text-muted-foreground leading-tight">Distribuição por tipo de cliente</div>
          </div>
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="text-[20px] font-medium text-foreground leading-none">{total}</span>
          <span className="text-[12px] text-muted-foreground">total</span>
        </div>
      </div>

      {/* Barra de proporção */}
      <div className="mt-4 mb-4 h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
        <div
          className="bg-pf transition-all duration-300"
          style={{ width: `${pfPercent}%` }}
          aria-hidden="true"
        />
        <div
          className="bg-pj transition-all duration-300"
          style={{ width: `${pjPercent}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
        <SegmentCard
          variant="pf"
          label="Pessoa Física"
          sublabel="CPF"
          Icon={Users}
          count={pessoaFisica.count}
          percent={pfPercent}
          onClick={handlePf}
        />
        <SegmentCard
          variant="pj"
          label="Pessoa Jurídica"
          sublabel="CNPJ"
          Icon={Building2}
          count={pessoaJuridica.count}
          percent={pjPercent}
          onClick={handlePj}
        />
      </div>
    </div>
  );
}

export default Vinculo;
