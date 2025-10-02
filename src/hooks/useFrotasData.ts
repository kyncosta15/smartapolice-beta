import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface FrotaVeiculo {
  id: string;
  empresa_id: string;
  placa: string;
  renavam?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
  ano_modelo?: number;
  combustivel?: string;
  tipo_veiculo?: number;
  codigo_fipe?: string;
  categoria?: string;
  proprietario_tipo?: string;
  proprietario_doc?: string;
  proprietario_nome?: string;
  uf_emplacamento?: string;
  data_venc_emplacamento?: string;
  status_seguro: string;
  preco_fipe?: number;
  preco_nf?: number;
  percentual_tabela?: number;
  modalidade_compra?: string;
  consorcio_grupo?: string;
  consorcio_cota?: string;
  consorcio_taxa_adm?: number;
  data_venc_ultima_parcela?: string;
  localizacao?: string;
  codigo?: string;
  origem_planilha?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Additional fields for modal form
  motivo_sem_seguro?: string;
  previsao_circulacao?: string;
  observacoes_operacao?: string;
  
  // Dados relacionados
  responsaveis?: FrotaResponsavel[];
  pagamentos?: FrotaPagamento[];
  documentos?: FrotaDocumento[];
}

export interface FrotaResponsavel {
  id: string;
  veiculo_id: string;
  nome: string;
  telefone?: string;
  cnh_numero?: string;
  cnh_validade?: string;
  cnh_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FrotaPagamento {
  id: string;
  veiculo_id: string;
  tipo: string;
  valor: number;
  vencimento: string;
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FrotaDocumento {
  id: string;
  veiculo_id: string;
  tipo: string;
  nome_arquivo: string;
  url: string;
  origem: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  created_at: string;
}

export interface FrotaFilters {
  search: string;
  marcaModelo: string[];
  categoria: string[];
  status: string[];
  ordenacao: string;
}

export interface FrotaKPIs {
  totalVeiculos: number;
  semSeguro: number;
  veiculosSegurados: number;
  emplacamentoVencido: number;
  proximoVencimento: number;
  valorizacaoMedia: number;
  modalidadeDistribuicao: {
    financiado: number;
    avista: number;
    consorcio: number;
  };
}

export function useFrotasData(filters: FrotaFilters) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeEmpresaId } = useTenant();
  const [veiculos, setVeiculos] = useState<FrotaVeiculo[]>([]);
  const [allVeiculos, setAllVeiculos] = useState<FrotaVeiculo[]>([]); // Lista completa sem filtros
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Separate debounced filters for API calls
  const debouncedFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters.categoria, filters.status, filters.marcaModelo, debouncedSearch]);

  const fetchVeiculos = useCallback(async (isSearch = false, fetchAll = false) => {
    if (!user) return;

    try {
      // For search operations, show search loading instead of main loading
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('🔍 DEBUG: Verificando autenticação completa:', {
        userId: user.id,
        activeEmpresaId,
        email: user.email
      });

      // Verificar sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 DEBUG: Session Supabase:', {
        hasSession: !!session,
        userId: session?.user?.id,
        isAuthenticated: !!session?.user
      });

      if (!session?.user) {
        console.error('❌ Erro: Usuário não autenticado no Supabase');
        throw new Error('Usuário não autenticado');
      }

      // RLS irá filtrar automaticamente pela empresa do usuário
      let query = supabase
        .from('frota_veiculos')
        .select(`
          *,
          responsaveis:frota_responsaveis(*),
          pagamentos:frota_pagamentos(*),
          documentos:frota_documentos(*)
        `);

      // Get user's empresa_id from membership data instead of RPC
      const { data: userMembership } = await supabase
        .from('user_memberships')
        .select('empresa_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('🔍 DEBUG: User membership:', userMembership);
      
      let empresaId = userMembership?.empresa_id;
      
      // Se não tem membership, tentar criar empresa e membership
      if (!empresaId) {
        console.log('⚠️ Membership não encontrado, tentando criar empresa...');
        
        // Criar empresa baseada no email do usuário
        const empresaName = 'Cliente - ' + user.email;
        
        // Verificar se empresa já existe
        const { data: existingEmpresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('nome', empresaName)
          .maybeSingle();
          
        if (existingEmpresa) {
          empresaId = existingEmpresa.id;
        } else {
          // Criar nova empresa
          const { data: newEmpresa, error: empresaError } = await supabase
            .from('empresas')
            .insert({
              nome: empresaName,
              cnpj: user.email.replace('@', ''),
            })
            .select('id')
            .single();
            
          if (empresaError) {
            console.error('❌ Erro ao criar empresa:', empresaError);
            throw new Error('Não foi possível criar empresa para o usuário');
          }
          
          empresaId = newEmpresa.id;
        }
        
        // Criar membership
        const { error: membershipError } = await supabase
          .from('user_memberships')
          .insert({
            user_id: user.id,
            empresa_id: empresaId,
            role: 'owner'
          });
          
        if (membershipError) {
          console.error('❌ Erro ao criar membership:', membershipError);
          // Não falhar aqui, apenas log do erro
        }
      }
      
      if (!empresaId) {
        console.error('❌ Não foi possível obter empresa_id');
        throw new Error('Empresa não encontrada para o usuário. Entre em contato com o suporte.');
      }
      
      // Filter by user's company
      query = query.eq('empresa_id', empresaId);

      // Se fetchAll é true, buscar todos sem filtros para manter a lista completa
      if (!fetchAll) {
        // Aplicar filtros
        if (debouncedFilters.search) {
          const searchTerm = debouncedFilters.search.toLowerCase();
          query = query.or(`placa.ilike.%${searchTerm}%,proprietario_doc.ilike.%${searchTerm}%,proprietario_nome.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%`);
          console.log('🔍 Aplicando filtro de busca:', searchTerm);
        }

        if (debouncedFilters.categoria.length > 0) {
          query = query.in('categoria', debouncedFilters.categoria);
          console.log('🔍 Aplicando filtro de categoria:', debouncedFilters.categoria);
        }

        if (debouncedFilters.status.length > 0) {
          query = query.in('status_seguro', debouncedFilters.status);
          console.log('🔍 Aplicando filtro de status:', debouncedFilters.status);
        }
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro na query:', fetchError);
        throw fetchError;
      }

      // Sempre setar o array, mesmo que vazio
      const veiculosData = Array.isArray(data) ? data : [];
      
      if (fetchAll) {
        // Se é busca de todos, atualizar allVeiculos
        setAllVeiculos(veiculosData);
        console.log(`✅ Lista completa carregada: ${veiculosData.length} itens`);
      } else {
        // Se é busca filtrada, atualizar veiculos
        setVeiculos(veiculosData);
        console.log(`✅ Veículos filtrados: ${veiculosData.length} itens`);
      }
      
    } catch (err: any) {
      console.error('Erro ao buscar veículos:', err);
      setError(err.message);
      setVeiculos([]); // Garantir que não fica undefined
      
      // Só mostrar toast se for um erro real, não dados vazios
      if (!err.message?.includes('0 rows')) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os veículos. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [user?.id, activeEmpresaId, debouncedFilters, toast]);

  // Initial load - only once when user changes
  useEffect(() => {
    if (user && activeEmpresaId !== null) {
      console.log('🔄 Carregando dados da frota para empresa:', activeEmpresaId);
      // Buscar lista completa primeiro
      fetchVeiculos(false, true);
      // Se tem filtros ativos, buscar filtrados também
      const hasFilters = filters.search !== '' || filters.categoria.length > 0 || filters.status.length > 0;
      if (hasFilters) {
        fetchVeiculos(false, false);
      }
    }
  }, [user?.id, activeEmpresaId]); // Depend on both user and activeEmpresaId

  // Handle all filter changes - only when actual filter values change  
  useEffect(() => {
    if (!user || activeEmpresaId === null) return;

    // If search is cleared, make sure we fetch all data
    if (filters.search === '' && debouncedSearch === '' && 
        filters.categoria.length === 0 && filters.status.length === 0 && filters.marcaModelo.length === 0) {
      fetchVeiculos(false);
      return;
    }

    // For search, wait for debounce to complete
    if (filters.search !== '' && debouncedSearch !== filters.search) {
      return;
    }

    // If search was cleared but debounce hasn't caught up, force immediate fetch
    if (filters.search === '' && debouncedSearch !== '') {
      fetchVeiculos(false);
      return;
    }

    // Skip if no filters are active
    const hasAnyFilter = debouncedSearch !== '' || filters.categoria.length > 0 || filters.status.length > 0 || filters.marcaModelo.length > 0;
    if (!hasAnyFilter) return;

    // Determine if this is a search operation
    const isSearchOperation = debouncedSearch !== '';
    fetchVeiculos(isSearchOperation);
  }, [user?.id, activeEmpresaId, debouncedSearch, filters.categoria, filters.status, filters.marcaModelo, filters.search]); // Removido filters.ordenacao

  // Aplicar ordenação no frontend usando useMemo para performance
  const veiculosOrdenados = useMemo(() => {
    if (!filters.ordenacao || filters.ordenacao === 'padrao') {
      return veiculos;
    }

    return [...veiculos].sort((a, b) => {
      const nomeA = `${a.marca || ''} ${a.modelo || ''}`.trim().toLowerCase();
      const nomeB = `${b.marca || ''} ${b.modelo || ''}`.trim().toLowerCase();
      
      if (filters.ordenacao === 'a-z') {
        return nomeA.localeCompare(nomeB, 'pt-BR');
      } else if (filters.ordenacao === 'z-a') {
        return nomeB.localeCompare(nomeA, 'pt-BR');
      }
      return 0;
    });
  }, [veiculos, filters.ordenacao]);

  const allVeiculosOrdenados = useMemo(() => {
    if (!filters.ordenacao || filters.ordenacao === 'padrao') {
      return allVeiculos;
    }

    return [...allVeiculos].sort((a, b) => {
      const nomeA = `${a.marca || ''} ${a.modelo || ''}`.trim().toLowerCase();
      const nomeB = `${b.marca || ''} ${b.modelo || ''}`.trim().toLowerCase();
      
      if (filters.ordenacao === 'a-z') {
        return nomeA.localeCompare(nomeB, 'pt-BR');
      } else if (filters.ordenacao === 'z-a') {
        return nomeB.localeCompare(nomeA, 'pt-BR');
      }
      return 0;
    });
  }, [allVeiculos, filters.ordenacao]);

  // Escutar eventos de atualização da frota
  useEffect(() => {
    const handleFrotaUpdate = () => {
      console.log('Evento de atualização da frota recebido');
      fetchVeiculos(false);
    };

    window.addEventListener('frota-data-updated', handleFrotaUpdate);
    
    return () => {
      window.removeEventListener('frota-data-updated', handleFrotaUpdate);
    };
  }, []); // No dependencies to avoid re-creating the listener

  // Calcular KPIs - sempre com array válido e usando veiculosOrdenados
  const kpis = useMemo((): FrotaKPIs => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Garantir que veiculosOrdenados é sempre um array
    const veiculosArray = Array.isArray(veiculosOrdenados) ? veiculosOrdenados : [];
    
    const totalVeiculos = veiculosArray.length;
    const semSeguro = veiculosArray.filter(v => v.status_seguro === 'sem_seguro').length;
    const veiculosSegurados = veiculosArray.filter(v => v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro').length;
    
    const emplacamentoVencido = veiculosArray.filter(v => {
      if (!v.data_venc_emplacamento) return false;
      return new Date(v.data_venc_emplacamento) < today;
    }).length;

    const proximoVencimento = veiculosArray.filter(v => {
      if (!v.data_venc_emplacamento) return false;
      const vencimento = new Date(v.data_venc_emplacamento);
      return vencimento >= today && vencimento <= thirtyDaysFromNow;
    }).length;

    // Calcular valorização média
    const veiculosComPrecos = veiculosArray.filter(v => v.preco_fipe && v.preco_nf);
    const valorizacaoMedia = veiculosComPrecos.length > 0
      ? veiculosComPrecos.reduce((acc, v) => acc + ((v.preco_fipe! - v.preco_nf!) / v.preco_nf!) * 100, 0) / veiculosComPrecos.length
      : 0;

    // Distribuição por modalidade
    const modalidadeDistribuicao = {
      financiado: veiculosArray.filter(v => v.modalidade_compra === 'financiado').length,
      avista: veiculosArray.filter(v => v.modalidade_compra === 'avista').length,
      consorcio: veiculosArray.filter(v => v.modalidade_compra === 'consorcio').length,
    };

    return {
      totalVeiculos,
      semSeguro,
      veiculosSegurados,
      emplacamentoVencido,
      proximoVencimento,
      valorizacaoMedia,
      modalidadeDistribuicao,
    };
  }, [veiculosOrdenados]);

  const refetch = useCallback(() => {
    fetchVeiculos(false);
  }, [fetchVeiculos]);

  return {
    veiculos: veiculosOrdenados,
    allVeiculos: allVeiculosOrdenados,
    loading,
    searchLoading,
    error,
    refetch,
    kpis,
  };
}