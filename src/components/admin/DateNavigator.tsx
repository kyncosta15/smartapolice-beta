import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateNavigatorProps {
  value: string; // formato DD/MM/YYYY
  onChange: (date: string) => void;
  mode: 'mensal' | 'anual';
  onModeChange: (mode: 'mensal' | 'anual') => void;
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

export function DateNavigator({ value, onChange, mode, onModeChange }: DateNavigatorProps) {
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
    <div className="flex flex-wrap items-center gap-4">
      {/* Seletor de Modo */}
      <div className="flex gap-1 border rounded-md p-1">
        <button
          onClick={() => onModeChange('mensal')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            mode === 'mensal'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Análise Mensal
        </button>
        <button
          onClick={() => onModeChange('anual')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            mode === 'anual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Análise Anual
        </button>
      </div>

      {/* Navegação de Ano */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => changeYear(-1)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex gap-1">
          {[ano - 1, ano, ano + 1].map((y) => (
            <button
              key={y}
              onClick={() => {
                if (y !== ano) {
                  onChange(`${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${y}`);
                }
              }}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                y === ano
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        <button
          onClick={() => changeYear(1)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Navegação de Mês - Apenas em modo mensal */}
      {mode === 'mensal' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex gap-1">
            {MESES.map((m) => (
              <button
                key={m.numero}
                onClick={() => selectMonth(m.numero)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                  m.numero === mes
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => changeMonth(1)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
