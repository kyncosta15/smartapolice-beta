import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonthlyValueEditorProps {
  policyId: string;
  currentValue: number;
  onUpdate: (policyId: string, updates: any) => Promise<boolean>;
}

export function MonthlyValueEditor({ policyId, currentValue, onUpdate }: MonthlyValueEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue?.toString() || '0');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const formatInputValue = (val: string) => {
    // Remove tudo exceto números e vírgula/ponto
    const cleaned = val.replace(/[^\d.,]/g, '');
    return cleaned;
  };

  const parseValue = (val: string): number => {
    // Converte string formatada para número
    const normalized = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const handleSave = async () => {
    const numericValue = parseValue(value);
    
    if (numericValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const success = await onUpdate(policyId, {
        custo_mensal: numericValue,
        monthlyAmount: numericValue,
      });

      if (success) {
        toast({
          title: "Valor atualizado",
          description: `Valor mensal atualizado para R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao salvar valor mensal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o valor",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue?.toString() || '0');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(formatInputValue(e.target.value))}
            onKeyDown={handleKeyDown}
            className="h-7 w-24 pl-7 pr-1 text-xs text-right font-semibold"
            autoFocus
            disabled={isSaving}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <p className="font-semibold text-xs sm:text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
        {currentValue > 0 
          ? `R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : 'R$ 0,00'
        }
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        title="Editar valor mensal"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
