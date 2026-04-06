
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCoveragesStateProps {
  readOnly: boolean;
  onAddNew: () => void;
}

export const EmptyCoveragesState = ({ readOnly, onAddNew }: EmptyCoveragesStateProps) => {
  return (
    <div className="text-center py-6">
      <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">Coberturas não informadas</p>
      {!readOnly && (
        <Button
          onClick={onAddNew}
          size="sm"
          variant="outline"
          className="mt-3"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Primeira Cobertura
        </Button>
      )}
    </div>
  );
};
