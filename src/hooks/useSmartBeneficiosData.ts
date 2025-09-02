import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  contato_rh_nome?: string;
  contato_rh_email?: string;
  contato_rh_telefone?: string;
  created_at: string;
  updated_at: string;
}

export interface Colaborador {
  id: string;
  empresa_id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  cargo?: string;
  centro_custo?: string;
  data_admissao?: string;
  data_demissao?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  custo_mensal?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Dependente {
  id: string;
  colaborador_id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  grau_parentesco: 'conjuge' | 'filho' | 'filha' | 'mae' | 'pai' | 'outros';
  status: 'ativo' | 'inativo' | 'pendente';
  custo_mensal?: number;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  numero_ticket: string;
  colaborador_id?: string;
  empresa_id?: string;
  tipo: 'inclusao_dependente' | 'exclusao_dependente' | 'duvida_cobertura' | 'segunda_via_carteirinha' | 'duvida_geral';
  status: 'recebido' | 'em_validacao' | 'em_execucao' | 'concluido' | 'pendente_cliente' | 'cancelado';
  titulo: string;
  descricao?: string;
  canal_origem?: string;
  data_recebimento?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  vidasAtivas: number;
  custoMensal: number;
  custoMedioVida: number;
  vencimentosProximos: number;
  ticketsAbertos: number;
  colaboradoresAtivos: number;
  dependentesAtivos: number;
  ticketsPendentes: number;
}

export const useSmartBeneficiosData = () => {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    vidasAtivas: 0,
    custoMensal: 0,
    custoMedioVida: 0,
    vencimentosProximos: 0,
    ticketsAbertos: 0,
    colaboradoresAtivos: 0,
    dependentesAtivos: 0,
    ticketsPendentes: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados das empresas
  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err);
      setError(err.message);
    }
  };

  // Buscar colaboradores
  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setColaboradores(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar colaboradores:', err);
      setError(err.message);
    }
  };

  // Buscar dependentes
  const fetchDependentes = async () => {
    try {
      const { data, error } = await supabase
        .from('dependentes')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setDependentes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar dependentes:', err);
      setError(err.message);
    }
  };

  // Buscar tickets
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar tickets:', err);
      setError(err.message);
    }
  };

  // Calcular métricas do dashboard
  const calculateMetrics = () => {
    const colaboradoresAtivos = colaboradores.length;
    const dependentesAtivos = dependentes.length;
    const vidasAtivas = colaboradoresAtivos + dependentesAtivos;
    
    const custoMensal = colaboradores.reduce((sum, col) => sum + (col.custo_mensal || 0), 0) +
                      dependentes.reduce((sum, dep) => sum + (dep.custo_mensal || 0), 0);
    
    const custoMedioVida = vidasAtivas > 0 ? custoMensal / vidasAtivas : 0;
    
    const ticketsAbertos = tickets.filter(t => 
      ['recebido', 'em_validacao', 'em_execucao', 'pendente_cliente'].includes(t.status)
    ).length;
    
    const ticketsPendentes = tickets.filter(t => t.status === 'pendente_cliente').length;

    setMetrics({
      vidasAtivas,
      custoMensal,
      custoMedioVida,
      vencimentosProximos: 8, // Mock - implementar lógica real
      ticketsAbertos,
      colaboradoresAtivos,
      dependentesAtivos,
      ticketsPendentes
    });
  };

  // Carregar todos os dados
  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchEmpresas(),
        fetchColaboradores(), 
        fetchDependentes(),
        fetchTickets()
      ]);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar colaborador
  const addColaborador = async (colaboradorData: Omit<Colaborador, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert([colaboradorData])
        .select()
        .single();

      if (error) throw error;
      
      setColaboradores(prev => [...prev, data]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Erro ao adicionar colaborador:', err);
      return { data: null, error: err.message };
    }
  };

  // Atualizar colaborador
  const updateColaborador = async (id: string, updates: Partial<Colaborador>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setColaboradores(prev => prev.map(col => col.id === id ? data : col));
      return { data, error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar colaborador:', err);
      return { data: null, error: err.message };
    }
  };

  // Criar ticket
  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'numero_ticket' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ...ticketData,
          numero_ticket: '', // Será substituído pelo trigger
          data_recebimento: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTickets(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Erro ao criar ticket:', err);
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    calculateMetrics();
  }, [colaboradores, dependentes, tickets]);

  return {
    empresas,
    colaboradores,
    dependentes,
    tickets,
    metrics,
    isLoading,
    error,
    loadData,
    addColaborador,
    updateColaborador,
    createTicket
  };
};