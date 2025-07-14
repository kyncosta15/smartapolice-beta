
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  console.log(`🎯 [StatusBadge] Renderizando status: ${status}`);
  
  return (
    <Badge className={STATUS_COLORS[status] || STATUS_COLORS.vigente}>
      <div className="w-2 h-2 bg-current rounded-full mr-2 opacity-80"></div>
      {formatStatusText(status)}
    </Badge>
  );
};
