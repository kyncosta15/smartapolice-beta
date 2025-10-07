import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AdminMetrics, CompanySummary, ApprovalRequest } from '@/types/admin';

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_dashboard_metrics');
      
      if (error) throw error;
      setMetrics(data as unknown as AdminMetrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as métricas do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_companies_summary');
      
      if (error) throw error;
      setCompanies(data as unknown as CompanySummary[]);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadCompanies();
  }, []);

  return {
    metrics,
    companies,
    loading,
    refreshMetrics: loadMetrics,
    refreshCompanies: loadCompanies,
  };
}

export function useAdminApprovals(status: string = 'pending') {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_list_approval_requests', {
        p_status: status,
      });
      
      if (error) throw error;
      setRequests(data as unknown as ApprovalRequest[]);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as solicitações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, note?: string) => {
    try {
      const { error } = await supabase.rpc('approve_insurance_request', {
        p_request_id: requestId,
        p_decision_note: note,
      });

      if (error) throw error;

      toast({
        title: 'Solicitação aprovada',
        description: 'O status do veículo foi atualizado com sucesso.',
      });

      await loadRequests();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a solicitação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string, note?: string) => {
    try {
      const { error } = await supabase.rpc('reject_insurance_request', {
        p_request_id: requestId,
        p_decision_note: note,
      });

      if (error) throw error;

      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação foi rejeitada.',
      });

      await loadRequests();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a solicitação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status]);

  return {
    requests,
    loading,
    approveRequest,
    rejectRequest,
    refreshRequests: loadRequests,
  };
}
