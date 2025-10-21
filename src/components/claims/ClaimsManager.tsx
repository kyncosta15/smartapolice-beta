import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ClaimsHeader } from './ClaimsHeader';
import { ClaimsKpis } from './ClaimsKpis';
import { ClaimsList } from './ClaimsList';
import { ClaimsDetailsDrawer } from './ClaimsDetailsDrawer';
import { NovoTicketModalV4 } from '@/components/sinistros/NovoTicketModalV4';
import { AssistancesView } from './AssistancesView';
import { Claim, Assistance, ClaimsView } from '@/types/claims';
import { ClaimsService } from '@/services/claims';

interface ClaimsManagerProps {
  onClaimEdit?: (claim: Claim) => void;
}

export function ClaimsManager({ onClaimEdit }: ClaimsManagerProps) {
  const [currentView, setCurrentView] = useState<ClaimsView>('sinistros');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, currentView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentView === 'sinistros') {
        const { data } = await ClaimsService.getClaims({
          search: searchTerm,
          status: statusFilter
        });
        setClaims(data);
      } else {
        const { data } = await ClaimsService.getAssistances({
          search: searchTerm,
          status: statusFilter
        });
        setAssistances(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSelect = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsDetailsDrawerOpen(true);
  };

  const handleClaimEdit = (claim: Claim) => {
    onClaimEdit?.(claim);
  };

  const handleClaimDelete = async (claimId: string) => {
    try {
      await ClaimsService.deleteClaim(claimId);
      setClaims(prev => prev.filter(c => c.id !== claimId));
    } catch (error) {
      console.error('Error deleting claim:', error);
    }
  };

  const handleTicketCreated = () => {
    loadData(); // Refresh data after ticket creation
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Sinistros e Assistências
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todos os sinistros e assistências
          </p>
        </div>
        
        <NovoTicketModalV4
          trigger={
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          }
          onTicketCreated={handleTicketCreated}
          initialTipo={currentView === 'sinistros' ? 'sinistro' : 'assistencia'}
        />
      </div>

      <ClaimsHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewTicket={() => {}} // Não usado mais, o botão está acima
      />

      <ClaimsKpis
        claims={claims}
        assistances={assistances}
        loading={loading}
      />

      {currentView === 'sinistros' ? (
        <ClaimsList
          claims={claims}
          loading={loading}
          onClaimSelect={handleClaimSelect}
          onClaimEdit={handleClaimEdit}
          onClaimDelete={handleClaimDelete}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      ) : (
        <AssistancesView
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      <ClaimsDetailsDrawer
        claim={selectedClaim}
        open={isDetailsDrawerOpen}
        onOpenChange={setIsDetailsDrawerOpen}
      />
    </div>
  );
}