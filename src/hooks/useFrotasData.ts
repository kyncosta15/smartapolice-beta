import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

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
  funcao?: string;
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
  const [allVeiculos, setAllVeiculos] = useState<FrotaVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Single fetch: load ALL vehicles once, filter client-side
  const fetchVeiculos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      let empresaId = activeEmpresaId;

      if (!empresaId) {
        const { data: latestMembership } = await supabase
          .from('user_memberships')
          .select('empresa_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        empresaId = latestMembership?.empresa_id || null;
      }

      if (!empresaId) {
        const empresaName = 'Cliente - ' + user.email;
        const { data: existingEmpresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('nome', empresaName)
          .maybeSingle();

        if (existingEmpresa) {
          empresaId = existingEmpresa.id;
        } else {
          const { data: newEmpresa, error: empresaError } = await supabase
            .from('empresas')
            .insert({ nome: empresaName, cnpj: user.email.replace('@', '') })
            .select('id')
            .single();

          if (empresaError) throw new Error('Não foi possível criar empresa para o usuário');
          empresaId = newEmpresa.id;
        }

        await supabase.from('user_memberships').upsert(
          { user_id: user.id, empresa_id: empresaId, role: 'owner' },
          { onConflict: 'user_id,empresa_id' }
        );
      }

      const { data, error: fetchError } = await supabase
        .from('frota_veiculos')
        .select(`
          *,
          responsaveis:frota_responsaveis(*),
          pagamentos:frota_pagamentos(*),
          documentos:frota_documentos(*)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAllVeiculos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao buscar veículos:', err);
      setError(err.message);
      setAllVeiculos([]);
      if (!err.message?.includes('0 rows')) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os veículos. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeEmpresaId, toast]);

  // Load once when user/empresa changes
  useEffect(() => {
    if (user && activeEmpresaId !== null) {
      hasFetchedRef.current = false;
      fetchVeiculos();
    }
  }, [user?.id, activeEmpresaId]);

  // Listen for fleet update events
  useEffect(() => {
    const handleFrotaUpdate = () => fetchVeiculos();
    window.addEventListener('frota-data-updated', handleFrotaUpdate);
    return () => window.removeEventListener('frota-data-updated', handleFrotaUpdate);
  }, [fetchVeiculos]);

  // CLIENT-SIDE filtering — instant, no loading spinners
  const veiculosFiltrados = useMemo(() => {
    let result = allVeiculos;

    // Search filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(v =>
        (v.placa || '').toLowerCase().includes(term) ||
        (v.proprietario_doc || '').toLowerCase().includes(term) ||
        (v.proprietario_nome || '').toLowerCase().includes(term) ||
        (v.marca || '').toLowerCase().includes(term) ||
        (v.modelo || '').toLowerCase().includes(term) ||
        (v.chassi || '').toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filters.categoria.length > 0) {
      result = result.filter(v => filters.categoria.includes(v.categoria || ''));
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter(v => filters.status.includes(v.status_seguro || ''));
    }

    // Brand filter
    if (filters.marcaModelo.length > 0) {
      result = result.filter(v => filters.marcaModelo.includes(v.marca || ''));
    }

    // Sorting
    if (filters.ordenacao && filters.ordenacao !== 'padrao') {
      result = [...result].sort((a, b) => {
        const nomeA = `${a.marca || ''} ${a.modelo || ''}`.trim().toLowerCase();
        const nomeB = `${b.marca || ''} ${b.modelo || ''}`.trim().toLowerCase();
        return filters.ordenacao === 'a-z'
          ? nomeA.localeCompare(nomeB, 'pt-BR')
          : nomeB.localeCompare(nomeA, 'pt-BR');
      });
    }

    return result;
  }, [allVeiculos, filters.search, filters.categoria, filters.status, filters.marcaModelo, filters.ordenacao]);

  // KPIs based on all vehicles (unfiltered)
  const kpis = useMemo((): FrotaKPIs => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const arr = allVeiculos;
    
    return {
      totalVeiculos: arr.length,
      semSeguro: arr.filter(v => v.status_seguro === 'sem_seguro').length,
      veiculosSegurados: arr.filter(v => v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro').length,
      emplacamentoVencido: arr.filter(v => v.data_venc_emplacamento && new Date(v.data_venc_emplacamento) < today).length,
      proximoVencimento: arr.filter(v => {
        if (!v.data_venc_emplacamento) return false;
        const venc = new Date(v.data_venc_emplacamento);
        return venc >= today && venc <= thirtyDaysFromNow;
      }).length,
      valorizacaoMedia: (() => {
        const comPrecos = arr.filter(v => v.preco_fipe && v.preco_nf);
        return comPrecos.length > 0
          ? comPrecos.reduce((acc, v) => acc + ((v.preco_fipe! - v.preco_nf!) / v.preco_nf!) * 100, 0) / comPrecos.length
          : 0;
      })(),
      modalidadeDistribuicao: {
        financiado: arr.filter(v => v.modalidade_compra === 'financiado').length,
        avista: arr.filter(v => v.modalidade_compra === 'avista').length,
        consorcio: arr.filter(v => v.modalidade_compra === 'consorcio').length,
      },
    };
  }, [allVeiculos]);

  const refetch = useCallback(() => {
    fetchVeiculos();
  }, [fetchVeiculos]);

  return {
    veiculos: veiculosFiltrados,
    allVeiculos,
    loading,
    searchLoading: false, // No more search loading — filtering is instant
    error,
    refetch,
    kpis,
  };
}
