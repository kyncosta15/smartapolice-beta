import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AdminMetrics, CompanySummary, ApprovalRequest } from '@/types/admin';

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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

  const createCompany = async (companyData: {
    nome: string;
    cnpj: string;
    contato_rh_nome?: string;
    contato_rh_email?: string;
    contato_rh_telefone?: string;
  }) => {
    try {
      setDeleting(true);

      const { error } = await supabase.from('empresas').insert([companyData]);

      if (error) throw error;

      toast({
        title: 'Empresa criada',
        description: 'Empresa cadastrada com sucesso.',
      });

      await loadMetrics();
      await loadCompanies();
      return true;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a empresa.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const updateCompany = async (
    companyId: string,
    companyData: {
      nome?: string;
      cnpj?: string;
      contato_rh_nome?: string;
      contato_rh_email?: string;
      contato_rh_telefone?: string;
    }
  ) => {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from('empresas')
        .update(companyData)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Empresa atualizada',
        description: 'Dados da empresa atualizados com sucesso.',
      });

      await loadMetrics();
      await loadCompanies();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a empresa.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const deleteCompanies = async (companyIds: string[]) => {
    try {
      setDeleting(true);

      const { data, error } = await supabase.functions.invoke('admin-delete-companies', {
        body: { company_ids: companyIds },
      });

      if (error) throw error;

      toast({
        title: 'Empresas deletadas',
        description: `${companyIds.length} empresa(s) deletada(s) com sucesso.`,
      });

      await loadMetrics();
      await loadCompanies();
      return true;
    } catch (error) {
      console.error('Erro ao deletar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar as empresas.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeleting(true);

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;

      toast({
        title: 'Usuário deletado',
        description: 'Usuário removido com sucesso.',
      });

      await loadMetrics();
      await loadCompanies();
      return true;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setDeleting(false);
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
    deleting,
    refreshMetrics: loadMetrics,
    refreshCompanies: loadCompanies,
    createCompany,
    updateCompany,
    deleteCompanies,
    deleteUser,
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
