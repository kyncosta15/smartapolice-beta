
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
    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200 border-dashed">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <Input
            value={newCoverage.descricao}
            onChange={(e) => onUpdate('descricao', e.target.value)}
            placeholder="Descrição da nova cobertura"
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-3 ml-8">
          <span className="text-sm text-gray-600 min-w-0">LMI:</span>
          <Input
            type="number"
            value={newCoverage.lmi || ''}
            onChange={(e) => onUpdate('lmi', parseFloat(e.target.value) || 0)}
            placeholder="Valor do LMI"
            className="w-32"
          />
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
