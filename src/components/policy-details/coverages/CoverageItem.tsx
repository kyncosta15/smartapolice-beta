import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Edit3, Save, X, Trash2 } from 'lucide-react';
import { renderValue, renderValueAsString } from '@/utils/renderValue';

interface Coverage {
  id?: string;
  descricao: string;
  lmi?: number;
}

interface CoverageItemProps {
  coverage: Coverage;
  isEditing: boolean;
  readOnly: boolean;
  onEdit: (coverage: Coverage) => void;
  onSave: (coverage: Coverage) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof Coverage, value: string | number) => void;
}

export const CoverageItem = ({
  coverage,
  isEditing,
  readOnly,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdate,
}: CoverageItemProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              value={renderValueAsString(coverage.descricao)}
              onChange={(e) => onUpdate(coverage.id!, 'descricao', e.target.value)}
              placeholder="Descrição da cobertura"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              LMI (R$)
            </label>
            <Input
              type="number"
              value={coverage.lmi || ''}
              onChange={(e) => onUpdate(coverage.id!, 'lmi', Number(e.target.value))}
              placeholder="Limite Máximo de Indenização"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={() => onSave(coverage)} size="sm" className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline" className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-md bg-primary/10 p-2 flex-shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1 leading-tight break-words">
              {renderValue(coverage.descricao)}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                LMI:
              </span>
              <span className="text-base font-semibold text-success whitespace-nowrap">
                {formatCurrency(coverage.lmi)}
              </span>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-1 shrink-0">
            <Button
              onClick={() => onEdit(coverage)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => coverage.id && onDelete(coverage.id)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
