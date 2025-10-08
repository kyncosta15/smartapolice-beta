import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

export interface CompanyDetails {
  empresa_id: string;
  empresa_nome: string;
  usuarios: number;
  veiculos: number;
  apolices: number;
  apolices_ativas: number;
  sinistros_abertos: number;
  sinistros_total: number;
  assistencias_abertas: number;
  assistencias_total: number;
  ultima_atividade: string;
  users: CompanyUser[];
}

export function useCompanyDetails(empresaId: string | null) {
  const [details, setDetails] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!empresaId) {
      setDetails(null);
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      try {
        // Buscar empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, nome')
          .eq('id', empresaId)
          .single();

        if (!empresa) {
          setDetails(null);
          return;
        }

        // Buscar usuários da empresa
        const { count: usuariosCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('default_empresa_id', empresaId);

        // Buscar veículos da empresa
        const { count: veiculosCount } = await supabase
          .from('frota_veiculos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId);

        // Buscar usuários da empresa através de memberships
        const { data: empresaMemberships } = await supabase
          .from('user_memberships')
          .select('user_id')
          .eq('empresa_id', empresaId);

        const userIds = empresaMemberships?.map(m => m.user_id) || [];

        // Buscar detalhes dos usuários
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, name, role, created_at')
          .in('id', userIds)
          .order('created_at', { ascending: false });

        // Buscar apólices de benefícios
        const { data: apolicesBeneficios, count: beneficiosCount } = await supabase
          .from('apolices_beneficios')
          .select('status', { count: 'exact' })
          .eq('empresa_id', empresaId);

        // Buscar apólices de PDFs (auto)
        const { data: policiesPdfs, count: pdfsCount } = await supabase
          .from('policies')
          .select('status', { count: 'exact' })
          .in('user_id', userIds);

        // Somar ambas as contagens
        const apolicesCount = (beneficiosCount || 0) + (pdfsCount || 0);
        
        // Contar ativas de ambas as tabelas
        const beneficiosAtivas = apolicesBeneficios?.filter(a => a.status === 'ativa').length || 0;
        const pdfsAtivas = policiesPdfs?.filter(a => a.status === 'vigente' || a.status === 'ativa').length || 0;
        const apolicesAtivas = beneficiosAtivas + pdfsAtivas;

        // Buscar sinistros da empresa
        const { data: sinistros, count: sinistrosTotal } = await supabase
          .from('tickets')
          .select('status', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .eq('tipo', 'sinistro');

        const sinistrosAbertos = sinistros?.filter(
          s => !['finalizado', 'encerrado'].includes(s.status)
        ).length || 0;

        // Buscar assistências da empresa
        const { data: assistencias, count: assistenciasTotal } = await supabase
          .from('tickets')
          .select('status', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .eq('tipo', 'assistencia');

        const assistenciasAbertas = assistencias?.filter(
          a => !['finalizado', 'encerrado'].includes(a.status)
        ).length || 0;

        // Buscar última atividade
        const { data: ultimaAtividade } = await supabase
          .from('frota_veiculos')
          .select('updated_at')
          .eq('empresa_id', empresaId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setDetails({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          usuarios: usuariosCount || 0,
          veiculos: veiculosCount || 0,
          apolices: apolicesCount || 0,
          apolices_ativas: apolicesAtivas,
          sinistros_abertos: sinistrosAbertos,
          sinistros_total: sinistrosTotal || 0,
          assistencias_abertas: assistenciasAbertas,
          assistencias_total: assistenciasTotal || 0,
          ultima_atividade: ultimaAtividade?.updated_at || new Date().toISOString(),
          users: (usersData || []) as CompanyUser[],
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes da empresa:', error);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [empresaId]);

  return { details, loading };
}
