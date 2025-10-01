
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
  onUpdate
}: CoverageItemProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200">
        <div className="space-y-3">
          <div>
            <label className="text-xs sm:text-sm font-medium text-blue-700 mb-1 block">Descrição</label>
            <Input
              value={renderValueAsString(coverage.descricao)}
              onChange={(e) => onUpdate(coverage.id!, 'descricao', e.target.value)}
              placeholder="Descrição da cobertura"
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-blue-700 mb-1 block">LMI (R$)</label>
            <Input
              type="number"
              value={coverage.lmi || ''}
              onChange={(e) => onUpdate(coverage.id!, 'lmi', Number(e.target.value))}
              placeholder="Limite Máximo de Indenização"
              className="w-full text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={() => onSave(coverage)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="text-gray-600 border-gray-300 w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-blue-100 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-gray-900 font-sf-pro mb-1 leading-tight break-words">
              {renderValue(coverage.descricao)}
            </h4>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-blue-600 font-medium">LMI:</span>
              <span className="text-base sm:text-lg font-bold text-green-600 font-sf-pro whitespace-nowrap">
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
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={() => coverage.id && onDelete(coverage.id)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
