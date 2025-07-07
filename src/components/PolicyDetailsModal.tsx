
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from './policy-details/StatusBadge';
import { GeneralInfoCard } from './policy-details/GeneralInfoCard';
import { InsurerInfoCard } from './policy-details/InsurerInfoCard';
import { VehicleInfoCard } from './policy-details/VehicleInfoCard';
import { FinancialInfoCard } from './policy-details/FinancialInfoCard';
import { ValidityInfoCard } from './policy-details/ValidityInfoCard';
import { ResponsiblePersonCard } from './policy-details/ResponsiblePersonCard';
import { getTypeLabel } from './policy-details/utils';

interface PolicyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onDelete: (policyId: string) => void;
}

export const PolicyDetailsModal = ({ isOpen, onClose, policy, onDelete }: PolicyDetailsModalProps) => {
  const { toast } = useToast();

  if (!policy) return null;

  const handleDelete = () => {
    onDelete(policy.id);
    toast({
      title: "Apólice Removida",
      description: `${policy.name} foi removida com sucesso`,
      variant: "default"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl font-sf-pro">
        <DialogHeader className="border-b border-gray-200 pb-6 px-8 pt-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-gray-900 mb-4 font-sf-pro leading-tight">
                {policy.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={policy.status} />
                <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
                  {getTypeLabel(policy.type)}
                </Badge>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="font-sf-pro font-medium hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg px-4 py-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GeneralInfoCard policy={policy} />
            <InsurerInfoCard policy={policy} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <VehicleInfoCard policy={policy} />
            <FinancialInfoCard policy={policy} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ValidityInfoCard policy={policy} />
            <ResponsiblePersonCard policy={policy} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
