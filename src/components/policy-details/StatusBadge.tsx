
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
            Ativa
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-amber-600 rounded-full mr-2 animate-pulse"></div>
            Vencendo
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            Vencida
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
            Em Análise
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="font-sf-pro px-3 py-1.5 shadow-sm">Desconhecido</Badge>;
    }
  };

  return getStatusBadge(status);
};
