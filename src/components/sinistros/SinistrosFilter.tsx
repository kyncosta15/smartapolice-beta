import React from 'react';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketsListV2 } from '@/components/tickets/TicketsListV2';
import { Badge } from '@/components/ui/badge';
import { useUIVersion } from '@/hooks/useUIVersion';
import { Claim, Assistance } from '@/types/claims';

interface SinistrosFilterProps {
  claims: Claim[];
  assistances: Assistance[];
  loading: boolean;
  filter?: 'sinistro' | 'assistencia' | 'todos';
  onViewClaim?: (id: string) => void;
  onEditClaim?: (id: string) => void;
  onDeleteClaim?: (id: string) => void | Promise<void>;
}

export function SinistrosFilter({ 
  claims, 
  assistances, 
  loading, 
  filter = 'todos',
  onViewClaim,
  onEditClaim,
  onDeleteClaim 
}: SinistrosFilterProps) {
  const uiVersion = useUIVersion('sinistros');

  // Filtrar dados RIGOROSAMENTE baseado no tipo selecionado
  const filteredClaims = filter === 'sinistro' ? claims : (filter === 'todos' ? claims : []);
  const filteredAssistances = filter === 'assistencia' ? assistances : (filter === 'todos' ? assistances : []);
  
  console.log('🔍 SinistrosFilter - Dados recebidos:', {
    filter,
    claimsReceived: claims.length,
    assistancesReceived: assistances.length,
    filteredClaims: filteredClaims.length,
    filteredAssistances: filteredAssistances.length
  });

  // Wrapper para garantir que sempre retorna Promise
  const handleDelete = async (id: string) => {
    if (onDeleteClaim) {
      await Promise.resolve(onDeleteClaim(id));
    }
  };

  const getFilterDescription = () => {
    switch (filter) {
      case 'sinistro':
        return `Mostrando apenas sinistros (${claims.length} encontrados)`;
      case 'assistencia':
        return `Mostrando apenas assistências (${assistances.length} encontradas)`;
      default:
        return `Mostrando todos os tickets (${claims.length + assistances.length} encontrados)`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {getFilterDescription()}
        </div>
        {filter !== 'todos' && (
          <Badge variant="outline" className="text-xs">
            Filtro: {filter === 'sinistro' ? 'Sinistros' : 'Assistências'}
          </Badge>
        )}
      </div>

      {/* Lista filtrada */}
      {uiVersion.useV2 ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lista de Tickets (V2)</h3>
            <Badge variant="secondary" className="text-xs">
              React Aria + Advanced Filtering
            </Badge>
          </div>
          <TicketsListV2
            claims={filteredClaims}
            assistances={filteredAssistances}
            loading={loading}
            onViewClaim={onViewClaim}
            onEditClaim={onEditClaim}
            onDeleteClaim={handleDelete}
          />
        </>
      ) : (
        <>
          {/* V1 não suporta filtragem, então usamos V2 sempre */}
          <TicketsListV2
            claims={filteredClaims as any}
            assistances={filteredAssistances as any}
            loading={loading}
            onViewClaim={onViewClaim}
            onEditClaim={onEditClaim}
            onDeleteClaim={handleDelete}
          />
        </>
      )}
    </div>
  );
}