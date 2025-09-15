import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FrotaVeiculo {
  id: string;
  empresa_id: string;
  placa: string;
  renavam?: string;
  marca?: string;
  modelo?: string;
  ano_modelo?: number;
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
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
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
}

export interface FrotaKPIs {
  totalVeiculos: number;
  semSeguro: number;
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
  const [veiculos, setVeiculos] = useState<FrotaVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVeiculos = async () => {
    if (!user?.company) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Query base
      let query = supabase
        .from('frota_veiculos')
        .select(`
          *,
          responsaveis:frota_responsaveis(*),
          pagamentos:frota_pagamentos(*),
          documentos:frota_documentos(*)
        `)
        .eq('empresa_id', empresa.id);

      // Aplicar filtros
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`
          placa.ilike.%${searchTerm}%,
          proprietario_doc.ilike.%${searchTerm}%,
          proprietario_nome.ilike.%${searchTerm}%,
          marca.ilike.%${searchTerm}%,
          modelo.ilike.%${searchTerm}%
        `);
      }

      if (filters.categoria.length > 0) {
        query = query.in('categoria', filters.categoria);
      }

      if (filters.status.length > 0) {
        query = query.in('status_seguro', filters.status);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setVeiculos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar veículos:', err);
      setError(err.message);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os veículos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, [user?.company, filters]);

  // Calcular KPIs
  const kpis = useMemo((): FrotaKPIs => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const totalVeiculos = veiculos.length;
    const semSeguro = veiculos.filter(v => v.status_seguro === 'sem_seguro').length;
    
    const emplacamentoVencido = veiculos.filter(v => {
      if (!v.data_venc_emplacamento) return false;
      return new Date(v.data_venc_emplacamento) < today;
    }).length;

    const proximoVencimento = veiculos.filter(v => {
      if (!v.data_venc_emplacamento) return false;
      const vencimento = new Date(v.data_venc_emplacamento);
      return vencimento >= today && vencimento <= thirtyDaysFromNow;
    }).length;

    // Calcular valorização média
    const veiculosComPrecos = veiculos.filter(v => v.preco_fipe && v.preco_nf);
    const valorizacaoMedia = veiculosComPrecos.length > 0
      ? veiculosComPrecos.reduce((acc, v) => acc + ((v.preco_fipe! - v.preco_nf!) / v.preco_nf!) * 100, 0) / veiculosComPrecos.length
      : 0;

    // Distribuição por modalidade
    const modalidadeDistribuicao = {
      financiado: veiculos.filter(v => v.modalidade_compra === 'financiado').length,
      avista: veiculos.filter(v => v.modalidade_compra === 'avista').length,
      consorcio: veiculos.filter(v => v.modalidade_compra === 'consorcio').length,
    };

    return {
      totalVeiculos,
      semSeguro,
      emplacamentoVencido,
      proximoVencimento,
      valorizacaoMedia,
      modalidadeDistribuicao,
    };
  }, [veiculos]);

  const refetch = () => {
    fetchVeiculos();
  };

  return {
    veiculos,
    loading,
    error,
    refetch,
    kpis,
  };
}