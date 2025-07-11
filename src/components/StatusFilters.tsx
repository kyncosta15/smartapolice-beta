
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
      bgColor: 'bg-emerald-500',
      bgColorHover: 'hover:bg-emerald-500',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    { 
      value: 'renovada_aguardando', 
      label: 'Renovada/Aguardando emissão', 
      bgColor: 'bg-blue-500',
      bgColorHover: 'hover:bg-blue-500',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
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
