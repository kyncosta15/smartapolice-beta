import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateNavigatorProps {
  value: string; // formato DD/MM/YYYY
  onChange: (date: string) => void;
}

const MESES = [
  { label: 'Jan', numero: 1 },
  { label: 'Fev', numero: 2 },
  { label: 'Mar', numero: 3 },
  { label: 'Abr', numero: 4 },
  { label: 'Mai', numero: 5 },
  { label: 'Jun', numero: 6 },
  { label: 'Jul', numero: 7 },
  { label: 'Ago', numero: 8 },
  { label: 'Set', numero: 9 },
  { label: 'Out', numero: 10 },
  { label: 'Nov', numero: 11 },
  { label: 'Dez', numero: 12 },
];

export function DateNavigator({ value, onChange }: DateNavigatorProps) {
  // Parse da data atual
  const [dia, mes, ano] = value.split('/').map(Number);
  
  const changeYear = (delta: number) => {
    const newYear = ano + delta;
    onChange(`${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${newYear}`);
  };

  const changeMonth = (delta: number) => {
    let newMonth = mes + delta;
    let newYear = ano;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    // Ajustar dia se necessário
    const daysInMonth = new Date(newYear, newMonth, 0).getDate();
    const newDia = Math.min(dia, daysInMonth);
    
    onChange(`${newDia.toString().padStart(2, '0')}/${newMonth.toString().padStart(2, '0')}/${newYear}`);
  };

  const selectMonth = (monthNum: number) => {
    // Ajustar dia se necessário
    const daysInMonth = new Date(ano, monthNum, 0).getDate();
    const newDia = Math.min(dia, daysInMonth);
    
    onChange(`${newDia.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${ano}`);
  };

  return (
    <div className="space-y-2">
      {/* Navegação de Ano */}
      <div className="flex items-center justify-center gap-2 bg-primary rounded-md px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeYear(-1)}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1">
          {[ano - 1, ano, ano + 1].map((y) => (
            <button
              key={y}
              onClick={() => {
                if (y !== ano) {
                  onChange(`${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${y}`);
                }
              }}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                y === ano
                  ? 'bg-primary-foreground text-primary'
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeYear(1)}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Navegação de Mês */}
      <div className="flex items-center justify-center gap-2 bg-primary rounded-md px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(-1)}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1 flex-wrap justify-center">
          {MESES.map((m) => (
            <button
              key={m.numero}
              onClick={() => selectMonth(m.numero)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                m.numero === mes
                  ? 'bg-primary-foreground text-primary'
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(1)}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
