import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InsuranceApprovalRequest {
  id: string;
  empresa_id: string;
  veiculo_id: string;
  requested_by: string;
  current_status: string;
  requested_status: string;
  motivo?: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by?: string;
  decision_note?: string;
  created_at: string;
  decided_at?: string;
  // Relations
  frota_veiculos?: {
    placa: string;
    marca: string;
    modelo: string;
  };
  empresas?: {
    nome: string;
  };
  profiles?: {
    display_name: string;
  };
}

export function useInsuranceApprovals() {
  const [requests, setRequests] = useState<InsuranceApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insurance_approval_requests')
        .select(`
          *,
          frota_veiculos(placa, marca, modelo),
          empresas(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Silently handle permission/RLS errors - just set empty
        console.warn('Solicitações query:', error.message);
        setRequests([]);
        return;
      }
      
      setRequests((data || []) as InsuranceApprovalRequest[]);
    } catch (error) {
      console.warn('Erro ao carregar solicitações:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (params: {
    veiculo_id: string;
    empresa_id: string;
    current_status: string;
    requested_status: string;
    motivo?: string;
    silent?: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('insurance_approval_requests')
        .insert({
          veiculo_id: params.veiculo_id,
          empresa_id: params.empresa_id,
          current_status: params.current_status,
          requested_status: params.requested_status,
          motivo: params.motivo,
          requested_by: user.id,
        });

      if (error) throw error;

      if (!params.silent) {
        toast({
          title: 'Solicitação enviada',
          description: 'Sua solicitação foi enviada para aprovação do administrador.',
        });
      }

      await loadRequests();
      return true;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      if (!params.silent) {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a solicitação.',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const approveRequest = async (requestId: string, decisionNote?: string) => {
    try {
      const { error } = await supabase.rpc('approve_insurance_request', {
        p_request_id: requestId,
        p_decision_note: decisionNote,
      });

      if (error) throw error;

      toast({
        title: 'Solicitação aprovada',
        description: 'O status do veículo foi atualizado com sucesso.',
      });

      await loadRequests();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível aprovar a solicitação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string, decisionNote?: string) => {
    try {
      const { error } = await supabase.rpc('reject_insurance_request', {
        p_request_id: requestId,
        p_decision_note: decisionNote,
      });

      if (error) throw error;

      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação foi rejeitada.',
      });

      await loadRequests();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível rejeitar a solicitação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    loadRequests();

    // Subscribe to changes
    const channel = supabase
      .channel('insurance-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insurance_approval_requests',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    requests,
    loading,
    createRequest,
    approveRequest,
    rejectRequest,
    refreshRequests: loadRequests,
  };
}
