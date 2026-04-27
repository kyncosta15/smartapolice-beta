import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GlobalResultKind = 'apolice' | 'sinistro' | 'veiculo';

export interface GlobalSearchResult {
  kind: GlobalResultKind;
  id: string;
  title: string;
  subtitle?: string;
  /** Seção do dashboard para onde navegar ao selecionar. */
  section: string;
}

const DEBOUNCE_MS = 250;
const LIMIT_PER_KIND = 6;

/**
 * Escapa caracteres especiais do operador `ilike` do PostgREST (`,` quebra a
 * lista de filtros do `or()`). Mantemos `%` e `_` literais para o usuário não
 * precisar saber sintaxe de SQL.
 */
function escapeForOr(input: string): string {
  return input.replace(/[,()]/g, ' ').trim();
}

/**
 * Busca global server-side em apólices, sinistros e veículos da frota.
 * Aplica debounce de 250ms e limita resultados por categoria.
 * Respeita RLS automaticamente — cada usuário vê apenas os dados do seu tenant.
 */
export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const handle = setTimeout(async () => {
      const safe = escapeForOr(term);
      const like = `%${safe}%`;
      const onlyDigits = safe.replace(/\D/g, '');

      try {
        const [apolicesRes, sinistrosRes, veiculosRes] = await Promise.all([
          // Apólices
          supabase
            .from('policies')
            .select('id, segurado, numero_apolice, documento, seguradora, tipo_seguro, placa')
            .or(
              [
                `segurado.ilike.${like}`,
                `numero_apolice.ilike.${like}`,
                `seguradora.ilike.${like}`,
                `placa.ilike.${like}`,
                onlyDigits ? `documento.ilike.%${onlyDigits}%` : null,
              ]
                .filter(Boolean)
                .join(',')
            )
            .limit(LIMIT_PER_KIND),

          // Sinistros (tickets)
          supabase
            .from('tickets')
            .select('id, protocol_code, numero_sinistro, beneficiario_nome, status, tipo')
            .or(
              [
                `protocol_code.ilike.${like}`,
                `numero_sinistro.ilike.${like}`,
                `beneficiario_nome.ilike.${like}`,
                `status.ilike.${like}`,
              ].join(',')
            )
            .limit(LIMIT_PER_KIND),

          // Veículos da frota
          supabase
            .from('frota_veiculos')
            .select(
              'id, placa, marca, modelo, current_responsible_name, current_worksite_name, proprietario_nome'
            )
            .or(
              [
                `placa.ilike.${like}`,
                `modelo.ilike.${like}`,
                `marca.ilike.${like}`,
                `current_responsible_name.ilike.${like}`,
                `current_worksite_name.ilike.${like}`,
                `proprietario_nome.ilike.${like}`,
              ].join(',')
            )
            .limit(LIMIT_PER_KIND),
        ]);

        if (cancelled) return;

        const merged: GlobalSearchResult[] = [];

        for (const p of apolicesRes.data ?? []) {
          merged.push({
            kind: 'apolice',
            id: p.id,
            title: p.segurado || p.numero_apolice || 'Apólice',
            subtitle: [p.numero_apolice, p.seguradora, p.placa].filter(Boolean).join(' • '),
            section: 'policies',
          });
        }

        for (const t of sinistrosRes.data ?? []) {
          merged.push({
            kind: 'sinistro',
            id: t.id,
            title: t.beneficiario_nome || t.numero_sinistro || t.protocol_code || 'Sinistro',
            subtitle: [t.protocol_code, t.numero_sinistro, t.status].filter(Boolean).join(' • '),
            section: 'claims',
          });
        }

        for (const v of veiculosRes.data ?? []) {
          merged.push({
            kind: 'veiculo',
            id: v.id,
            title: v.placa || `${v.marca ?? ''} ${v.modelo ?? ''}`.trim() || 'Veículo',
            subtitle: [
              [v.marca, v.modelo].filter(Boolean).join(' '),
              v.current_responsible_name,
              v.current_worksite_name,
            ]
              .filter(Boolean)
              .join(' • '),
            section: 'frotas',
          });
        }

        setResults(merged);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return { results, loading };
}
