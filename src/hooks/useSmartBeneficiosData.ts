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
  protocol_code: string;
  request_id?: string;
  status: 'aberto' | 'processada' | 'erro' | 'aprovado' | 'rejeitado' | 'em_validacao' | 'processando';
  payload: any;
  rh_note?: string;
  external_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface ApolicesBeneficios {
  id: string;
  empresa_id: string;
  user_id: string;
  cnpj: string;
  razao_social: string;
  tipo_beneficio: string;
  seguradora: string;
  numero_apolice: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  valor_total?: number;
  valor_empresa?: number;
  valor_colaborador?: number;
  quantidade_vidas?: number;
  observacoes?: string;
  status: 'ativa' | 'cancelada' | 'suspensa' | 'vencida';
  created_at: string;
  updated_at: string;
}

export interface ColaboradorApoliceVinculo {
  id: string;
  colaborador_id: string;
  apolice_id: string;
  data_inclusao: string;
  data_exclusao?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  created_at: string;
  updated_at: string;
}

export interface ColaboradorLink {
  id: string;
  empresa_id: string;
  user_id: string;
  link_token: string;
  titulo: string;
  descricao?: string;
  campos_solicitados: any[];
  expira_em?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColaboradorSubmissao {
  id: string;
  link_id: string;
  dados_preenchidos: any;
  ip_origem?: string;
  user_agent?: string;
  status: 'recebida' | 'processada' | 'erro';
  observacoes?: string;
  numero_protocolo?: string;
  data_protocolo?: string;
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
  const [apolices, setApolices] = useState<ApolicesBeneficios[]>([]);
  const [colaboradorLinks, setColaboradorLinks] = useState<ColaboradorLink[]>([]);
  const [submissoes, setSubmissoes] = useState<ColaboradorSubmissao[]>([]);
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
    if (!user) {
      console.log('❌ fetchColaboradores: Usuário não encontrado');
      return;
    }
    
    try {
      console.log('🔍 fetchColaboradores: Buscando empresa do usuário:', user.id);
      
      // Primeiro buscar a empresa do usuário
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      console.log('👤 fetchColaboradores: Perfil do usuário:', { userProfile, userError });

      if (userError || !userProfile?.company) {
        console.log('❌ fetchColaboradores: Empresa do usuário não encontrada');
        return;
      }

      console.log('🏢 fetchColaboradores: Buscando empresa no banco:', userProfile.company);

      // Buscar empresa no banco
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      console.log('🏢 fetchColaboradores: Resultado da busca empresa:', { empresa, empresaError });

      if (empresaError || !empresa) {
        console.log('❌ fetchColaboradores: Empresa não encontrada no sistema');
        return;
      }

      console.log('👥 fetchColaboradores: Buscando colaboradores da empresa:', empresa.id);

      // Buscar colaboradores da empresa
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('status', 'ativo')
        .order('nome');

      console.log('👥 fetchColaboradores: Resultado:', { colaboradores: data, error, count: data?.length });

      if (error) throw error;
      setColaboradores(data || []);
    } catch (err: any) {
      console.error('❌ fetchColaboradores: Erro ao buscar colaboradores:', err);
      setError(err.message);
    }
  };

  // Buscar dependentes
  const fetchDependentes = async () => {
    if (!user) return;
    
    try {
      // Buscar dependentes através dos colaboradores do usuário
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userError || !userProfile?.company) {
        console.log('Empresa do usuário não encontrada');
        return;
      }

      // Buscar empresa no banco
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) {
        console.log('Empresa não encontrada no sistema');
        return;
      }

      // Buscar dependentes dos colaboradores da empresa
      const { data, error } = await supabase
        .from('dependentes')
        .select(`
          *,
          colaboradores!inner(empresa_id)
        `)
        .eq('colaboradores.empresa_id', empresa.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setDependentes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar dependentes:', err);
      setError(err.message);
    }
  };

  // Buscar tickets da tabela atual
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as Ticket[]);
    } catch (err: any) {
      console.error('Erro ao buscar tickets:', err);
      setError(err.message);
    }
  };

  // Buscar apólices
  const fetchApolices = async () => {
    if (!user) return;
    
    try {
      // Buscar apólices através da empresa do usuário
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userError || !userProfile?.company) {
        console.log('Empresa do usuário não encontrada');
        return;
      }

      // Buscar empresa no banco
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) {
        console.log('Empresa não encontrada no sistema');
        return;
      }

      // Buscar apólices da empresa
      const { data, error } = await supabase
        .from('apolices_beneficios')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('razao_social', { ascending: true });

      if (error) throw error;
      setApolices((data || []) as ApolicesBeneficios[]);
    } catch (err: any) {
      console.error('Erro ao buscar apólices:', err);
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
    
    // Contar tickets da tabela tickets real
    const ticketsAbertos = tickets.filter(t => t.status === 'aberto').length;
    const ticketsPendentes = tickets.filter(t => ['em_validacao', 'processando'].includes(t.status)).length;

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
    if (!user) {
      console.log('❌ loadData: Usuário não encontrado');
      return;
    }
    
    console.log('🔄 loadData: Iniciando carregamento de dados para usuário:', user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      // Carregar dados sequencialmente para debug
      console.log('📋 Carregando empresas...');
      await fetchEmpresas();
      
      console.log('👥 Carregando colaboradores...');
      await fetchColaboradores();
      
      console.log('👶 Carregando dependentes...');
      await fetchDependentes();
      
      console.log('🎫 Carregando tickets...');
      await fetchTickets();
      
      console.log('📄 Carregando apólices...');
      await fetchApolices();
      
      console.log('🔗 Carregando links...');
      await fetchColaboradorLinks();
      
      console.log('📨 Carregando submissões...');
      await fetchSubmissoes();
      
      console.log('✅ loadData: Todos os dados carregados com sucesso');
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar links de colaboradores
  const fetchColaboradorLinks = async () => {
    if (!user) return;
    
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userError || !userProfile?.company) return;

      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) return;

      const { data, error } = await supabase
        .from('colaborador_links')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setColaboradorLinks((data || []) as ColaboradorLink[]);
    } catch (err: any) {
      console.error('Erro ao buscar links:', err);
      setError(err.message);
    }
  };

  // Buscar submissões
  const fetchSubmissoes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('colaborador_submissoes')
        .select(`
          *,
          colaborador_links (
            titulo,
            empresa_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissoes((data || []) as ColaboradorSubmissao[]);
    } catch (err: any) {
      console.error('Erro ao buscar submissões:', err);
      setError(err.message);
    }
  };

  // Criar link para colaborador
  const createColaboradorLink = async (linkData: {
    titulo: string;
    descricao?: string;
    campos_solicitados: any[];
    expira_em?: string;
  }) => {
    try {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userError || !userProfile?.company) {
        throw new Error('Empresa do usuário não encontrada');
      }

      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) {
        throw new Error('Empresa não encontrada no sistema');
      }

      // Gerar token único
      const linkToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('colaborador_links')
        .insert([{
          empresa_id: empresa.id,
          user_id: user.id,
          link_token: linkToken,
          ...linkData
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar estado diretamente
      setColaboradorLinks(prev => [data as ColaboradorLink, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Erro ao criar link:', err);
      return { data: null, error: err.message };
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

  // Criar ticket - REMOVIDO para evitar conflito
  // Esta funcionalidade será implementada separadamente para benefícios

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
    apolices,
    colaboradorLinks,
    submissoes,
    metrics,
    isLoading,
    error,
    loadData,
    addColaborador,
    updateColaborador,
    createColaboradorLink
    // createTicket, // REMOVIDO temporariamente
  };
};