import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, DollarSign, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Installment {
  id?: string;
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
}

interface InstallmentEditorProps {
  installments: Installment[];
  onChange: (installments: Installment[]) => void;
  premium?: number;
  startDate?: string;
  className?: string;
  allowDateEdit?: boolean;
}

export function InstallmentEditor({ 
  installments, 
  onChange, 
  premium = 0,
  startDate,
  className,
  allowDateEdit = true
}: InstallmentEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editField, setEditField] = useState<'valor' | 'data' | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleStartEditValue = (index: number, currentValue: number) => {
    setEditingIndex(index);
    setEditField('valor');
    setEditValue(currentValue.toFixed(2).replace('.', ','));
  };

  const handleStartEditDate = (index: number, currentDate: string) => {
    if (!allowDateEdit) return;
    setEditingIndex(index);
    setEditField('data');
    setEditValue(currentDate || '');
  };

  const handleConfirmEdit = (index: number) => {
    if (editField === 'valor') {
      const newValue = parseFloat(editValue.replace(',', '.'));
      if (!isNaN(newValue) && newValue >= 0) {
        const newInstallments = [...installments];
        newInstallments[index] = {
          ...newInstallments[index],
          valor: newValue
        };
        onChange(newInstallments);
      }
    } else if (editField === 'data') {
      const newInstallments = [...installments];
      newInstallments[index] = {
        ...newInstallments[index],
        data: editValue
      };
      onChange(newInstallments);
    }
    setEditingIndex(null);
    setEditField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditField(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleConfirmEdit(index);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const totalValue = installments.reduce((sum, inst) => sum + inst.valor, 0);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs text-muted-foreground mb-2">
        Clique no valor ou na data para editar
      </div>
      
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
        {installments.map((installment, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                {installment.numero}
              </div>
              <div className="flex flex-col gap-1">
                {/* Valor */}
                {editingIndex === index && editField === 'valor' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">R$</span>
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-28 h-7 text-sm"
                      placeholder="0,00"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleConfirmEdit(index)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEditValue(index, installment.valor)}
                    className="flex items-center gap-1.5 group text-left"
                  >
                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      R$ {installment.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                
                {/* Data */}
                {editingIndex === index && editField === 'data' ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-36 h-7 text-sm"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleConfirmEdit(index)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEditDate(index, installment.data)}
                    disabled={!allowDateEdit}
                    className={cn(
                      "text-xs flex items-center gap-1 mt-0.5",
                      allowDateEdit 
                        ? "text-blue-600 hover:text-blue-700 group cursor-pointer" 
                        : "text-blue-600 cursor-default"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {installment.data ? new Date(installment.data).toLocaleDateString('pt-BR') : 'Sem data'}
                    {allowDateEdit && <Pencil className="h-2.5 w-2.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">Total:</span>
        <span className={cn(
          "text-lg font-bold",
          Math.abs(totalValue - premium) > 0.01 && premium > 0 
            ? "text-amber-600" 
            : "text-blue-900"
        )}>
          R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      {Math.abs(totalValue - premium) > 0.01 && premium > 0 && (
        <p className="text-xs text-amber-600">
          ⚠️ Total difere do prêmio anual (R$ {premium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
        </p>
      )}
    </div>
  );
}

// Função utilitária para gerar parcelas baseadas no prêmio e quantidade
export function generateInstallments(
  premium: number, 
  count: number, 
  startDate?: string
): Installment[] {
  const installments: Installment[] = [];
  const monthlyValue = premium / count;
  // NÃO usar startDate automaticamente - deixar vazio para inserção manual
  const start = startDate ? new Date(startDate) : null;

  for (let i = 0; i < count; i++) {
    let dueDate = '';
    if (start) {
      const dueDateObj = new Date(start);
      dueDateObj.setMonth(dueDateObj.getMonth() + i);
      dueDate = dueDateObj.toISOString().split('T')[0];
    }
    
    installments.push({
      numero: i + 1,
      valor: Math.round(monthlyValue * 100) / 100,
      data: dueDate,
      status: 'pendente'
    });
  }

  // Ajustar última parcela para fechar o valor total
  if (installments.length > 0) {
    const currentTotal = installments.reduce((sum, inst) => sum + inst.valor, 0);
    const diff = premium - currentTotal;
    if (Math.abs(diff) > 0.001) {
      installments[installments.length - 1].valor += diff;
      installments[installments.length - 1].valor = Math.round(installments[installments.length - 1].valor * 100) / 100;
    }
  }

  return installments;
}
