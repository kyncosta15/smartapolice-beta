
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vigente':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
            Vigente
          </Badge>
        );
      case 'renovada_aguardando':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
            Renovada/Aguardando emissão
          </Badge>
        );
      case 'nao_renovada':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
            Não renovada
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
            Em Análise
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="font-sf-pro px-3 py-1.5 shadow-sm">Desconhecido</Badge>;
    }
  };

  return getStatusBadge(status);
};
