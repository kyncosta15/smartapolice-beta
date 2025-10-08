import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInsuranceApprovals } from '@/hooks/useInsuranceApprovals';
import { useMemo } from 'react';

interface VehicleStatusBadgeProps {
  status: string;
  vehicleId: string;
}

export function VehicleStatusBadge({ status, vehicleId }: VehicleStatusBadgeProps) {
  const { requests } = useInsuranceApprovals();
  
  // Verificar se há solicitação pendente para este veículo
  const pendingRequest = useMemo(() => {
    return requests.find(
      r => r.veiculo_id === vehicleId && r.status === 'pending'
    );
  }, [requests, vehicleId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Segurado</Badge>;
      case 'sem_seguro':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Seguro</Badge>;
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Cotação</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (pendingRequest) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5">
              {getStatusBadge(status)}
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-1.5">
                <Clock className="h-3 w-3" />
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pendente aprovação ADM</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return getStatusBadge(status);
}
