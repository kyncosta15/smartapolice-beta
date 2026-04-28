import React from 'react';
import { User } from 'lucide-react';

interface Props {
  policy: any;
}

const initials = (name: string) => {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || '—';
};

export const ResponsibleCardV2: React.FC<Props> = ({ policy }) => {
  const name =
    policy?.responsavel_nome ||
    policy?.insuredName ||
    policy?.segurado ||
    policy?.name ||
    '—';
  const docType = policy?.documento_tipo || '';
  const subtitle = docType
    ? `${docType} · ${docType === 'CNPJ' ? 'Empresa' : 'Pessoa Física'}`
    : 'Segurado';

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Responsável</h3>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary-foreground">
            {initials(name)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {name}
          </div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};
