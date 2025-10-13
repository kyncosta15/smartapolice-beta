import React, { useState } from 'react';
import { ClaimsHeader } from './ClaimsHeader';
import { ClaimsKpis } from './ClaimsKpis';
import { ClaimsList } from './ClaimsList';
import { ClaimsDetailsDrawer } from './ClaimsDetailsDrawer';
import { NewClaimModal } from './NewClaimModal';
import { AssistancesView } from './AssistancesView';
import { Claim, Assistance, ClaimsView } from '@/types/claims';
import { ClaimsService } from '@/services/claims';
import { useEffect } from 'react';

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
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);

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

  const handleNewClaim = () => {
    setIsNewClaimModalOpen(true);
  };

  const handleClaimCreated = (claim: Claim) => {
    setClaims(prev => [claim, ...prev]);
    loadData(); // Refresh data
  };

  return (
    <div className="space-y-6">
      <ClaimsHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewTicket={handleNewClaim}
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

      <NewClaimModal
        open={isNewClaimModalOpen}
        onOpenChange={setIsNewClaimModalOpen}
        onClaimCreated={handleClaimCreated}
      />
    </div>
  );
}