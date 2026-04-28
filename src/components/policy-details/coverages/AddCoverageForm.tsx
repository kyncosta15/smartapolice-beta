
import { CheckCircle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Coverage {
  id?: string;
  descricao: string;
  lmi?: number;
}

interface AddCoverageFormProps {
  newCoverage: Coverage;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (field: keyof Coverage, value: string | number) => void;
}

export const AddCoverageForm = ({
  newCoverage,
  onSave,
  onCancel,
  onUpdate
}: AddCoverageFormProps) => {
  return (
    <div className="rounded-lg border border-primary/40 bg-card p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <Input
            value={newCoverage.descricao}
            onChange={(e) => onUpdate('descricao', e.target.value)}
            placeholder="Descrição da nova cobertura"
            className="flex-1"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-3 ml-8">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            LMI:
          </span>
          <Input
            type="number"
            value={newCoverage.lmi || ''}
            onChange={(e) => onUpdate('lmi', parseFloat(e.target.value) || 0)}
            placeholder="Valor do LMI"
            className="w-40"
          />
          <div className="flex gap-2 ml-auto">
            <Button onClick={onSave} size="sm">
              <Save className="h-4 w-4 mr-1.5" />
              Salvar
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline">
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
