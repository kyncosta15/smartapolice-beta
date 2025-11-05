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
    <div className="space-y-3">
      {/* Navegação de Ano */}
      <div className="flex items-center justify-center gap-1 border rounded-lg p-2 bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeYear(-1)}
          className="h-8 w-8 hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1 min-w-[180px] justify-center">
          {[ano - 1, ano, ano + 1].map((y) => (
            <button
              key={y}
              onClick={() => {
                if (y !== ano) {
                  onChange(`${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${y}`);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                y === ano
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
          className="h-8 w-8 hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Navegação de Mês */}
      <div className="flex items-start gap-1 border rounded-lg p-2 bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(-1)}
          className="h-8 w-8 hover:bg-accent flex-shrink-0 mt-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="grid grid-cols-6 gap-1 flex-1">
          {MESES.map((m) => (
            <button
              key={m.numero}
              onClick={() => selectMonth(m.numero)}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                m.numero === mes
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
          className="h-8 w-8 hover:bg-accent flex-shrink-0 mt-0.5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
