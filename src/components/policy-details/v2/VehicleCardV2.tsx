import React from 'react';
import { Car, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Props {
  policy: any;
  onEdit?: () => void;
}

export const VehicleCardV2: React.FC<Props> = ({ policy, onEdit }) => {
  const marca = policy?.marca?.trim();
  const modelo = (policy?.vehicleModel || policy?.modelo_veiculo || '').trim();
  const ano = (policy?.ano_modelo || '').toString().trim();
  const placa = (policy?.placa || '').toString().trim();

  const hasData = Boolean(marca || modelo || ano || placa);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-foreground">Veículo</h3>
        </div>
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
          >
            Editar <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">
              Dados do veículo incompletos
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Marca, modelo, ano e placa não foram preenchidos.
            </div>
          </div>
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-7 px-2.5 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
            >
              Completar
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          <Row label="Marca" value={marca || '—'} />
          <Row label="Modelo" value={modelo || '—'} />
          <Row label="Ano" value={ano || '—'} />
          <Row label="Placa" value={placa.toUpperCase() || '—'} mono />
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span
      className={`text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}
    >
      {value}
    </span>
  </div>
);
