
import { Button } from '@/components/ui/button';

interface StatusFiltersProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export const StatusFilters = ({ selectedStatus, onStatusChange }: StatusFiltersProps) => {
  const statusOptions = [
    { 
      value: 'vigente', 
      label: 'Vigente', 
      bgColor: 'bg-success',
      bgColorHover: 'hover:bg-success',
      textColor: 'text-success-foreground',
      borderColor: 'border-success/30'
    },
    { 
      value: 'renovada_aguardando', 
      label: 'Renovada/Aguardando emissão', 
      bgColor: 'bg-primary',
      bgColorHover: 'hover:bg-primary',
      textColor: 'text-primary',
      borderColor: 'border-primary/30'
    },
    { 
      value: 'nao_renovada', 
      label: 'Não renovada', 
      bgColor: 'bg-orange-500',
      bgColorHover: 'hover:bg-orange-500',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Botão "Todos" */}
      <Button
        variant={selectedStatus === null ? "default" : "outline"}
        onClick={() => onStatusChange(null)}
        className={`
          px-4 py-2 text-sm font-medium transition-colors
          ${selectedStatus === null 
            ? 'bg-gray-900 text-white' 
            : 'border-gray-200 text-gray-700 hover:bg-gray-500 hover:text-white'
          }
        `}
      >
        Todos
      </Button>
      
      {/* Botões de status específicos */}
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={selectedStatus === option.value ? "default" : "outline"}
          onClick={() => onStatusChange(option.value)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors
            ${selectedStatus === option.value 
              ? `${option.bgColor} text-white` 
              : `${option.borderColor} ${option.textColor} ${option.bgColorHover} hover:text-white`
            }
          `}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
