import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SinistrosFilter } from './SinistrosFilter';
import { Claim, Assistance } from '@/types/claims';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wrench, BarChart3 } from 'lucide-react';

interface SinistrosDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: 'sinistro' | 'assistencia' | 'todos';
  claims: Claim[];
  assistances: Assistance[];
  loading: boolean;
  onDeleteClaim?: (id: string) => void;
  onDeleteAssistance?: (id: string) => void;
}

export function SinistrosDetailsModal({
  open,
  onOpenChange,
  filter,
  claims,
  assistances,
  loading,
  onDeleteClaim,
  onDeleteAssistance,
}: SinistrosDetailsModalProps) {
  console.log('🔍 SinistrosDetailsModal - Renderizando:', {
    open,
    filter,
    claimsLength: claims.length,
    assistancesLength: assistances.length,
    loading,
    claimsPreview: claims.slice(0, 2),
    assistancesPreview: assistances.slice(0, 2)
  });

  const getModalTitle = () => {
    switch (filter) {
      case 'sinistro':
        return 'Sinistros';
      case 'assistencia':
        return 'Assistências';
      default:
        return 'Todos os Registros';
    }
  };

  const getModalIcon = () => {
    switch (filter) {
      case 'sinistro':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'assistencia':
        return <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getCount = () => {
    switch (filter) {
      case 'sinistro':
        return claims.length;
      case 'assistencia':
        return assistances.length;
      default:
        return claims.length + assistances.length;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl md:text-2xl">
            {getModalIcon()}
            <span>{getModalTitle()}</span>
            <Badge variant="secondary" className="ml-auto">
              {getCount()} registro{getCount() !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <SinistrosFilter
            claims={claims}
            assistances={assistances}
            loading={loading}
            filter={filter}
            onViewClaim={(id) => console.log('View claim:', id)}
            onEditClaim={(id) => console.log('Edit claim:', id)}
            onDeleteClaim={onDeleteClaim}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
