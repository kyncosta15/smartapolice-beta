
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCoveragesStateProps {
  readOnly: boolean;
  onAddNew: () => void;
}

export const EmptyCoveragesState = ({ readOnly, onAddNew }: EmptyCoveragesStateProps) => {
  return (
    <div className="text-center py-8">
      <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3" />
      <p className="text-blue-600 font-medium">Coberturas não informadas</p>
      {!readOnly && (
        <Button
          onClick={onAddNew}
          size="sm"
          variant="outline"
          className="mt-3 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Primeira Cobertura
        </Button>
      )}
    </div>
  );
};
