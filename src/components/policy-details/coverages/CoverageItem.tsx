
import { CheckCircle, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/currencyFormatter';

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
  onDelete: (coverageId: string) => void;
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
  onUpdate
}: CoverageItemProps) => {
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <Input
              value={coverage.descricao}
              onChange={(e) => onUpdate(coverage.id!, 'descricao', e.target.value)}
              placeholder="Descrição da cobertura"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 ml-8">
            <span className="text-sm text-gray-600 min-w-0">LMI:</span>
            <Input
              type="number"
              value={coverage.lmi || ''}
              onChange={(e) => onUpdate(coverage.id!, 'lmi', parseFloat(e.target.value) || 0)}
              placeholder="Valor do LMI"
              className="w-32"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => onSave(coverage)}
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
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800 font-sf-pro leading-relaxed">
              {coverage.descricao}
            </span>
            {typeof coverage.lmi === 'number' && coverage.lmi > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                LMI: {formatCurrency(coverage.lmi)}
              </span>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <Button
              onClick={() => onEdit(coverage)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete(coverage.id!)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
