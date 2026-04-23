import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface AttachedDoc {
  id: string;
  policy_id: string;
  title: string;
  original_filename: string;
  storage_path: string;
  category: string;
  mime_type: string | null;
  created_at: string;
}

const BUCKET = 'rcorp-docs';

/**
 * Para uma lista de policy IDs, retorna os documentos vinculados na Central
 * de Documentos (entity_type = APOLICE, deleted_at NULL), agrupados por policy_id.
 * Também expõe helper para obter URL assinada de download.
 */
export function usePolicyAttachedDocs(policyIds: string[]) {
  const { activeEmpresaId } = useTenant();
  const [docsByPolicy, setDocsByPolicy] = useState<Record<string, AttachedDoc[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!policyIds || policyIds.length === 0) {
      setDocsByPolicy({});
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let query = (supabase as any)
          .from('documents')
          .select('id, policy_id, title, original_filename, storage_path, category, mime_type, created_at')
          .eq('entity_type', 'APOLICE')
          .is('deleted_at', null)
          .in('policy_id', policyIds);

        if (activeEmpresaId) {
          query = query.eq('account_id', activeEmpresaId);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;

        const grouped: Record<string, AttachedDoc[]> = {};
        (data || []).forEach((d: AttachedDoc) => {
          if (!d.policy_id) return;
          if (!grouped[d.policy_id]) grouped[d.policy_id] = [];
          grouped[d.policy_id].push(d);
        });
        // ordena cada grupo por data desc
        Object.keys(grouped).forEach(k => {
          grouped[k].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        });
        setDocsByPolicy(grouped);
      } catch (err) {
        console.error('[usePolicyAttachedDocs] erro:', err);
        if (!cancelled) setDocsByPolicy({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyIds.join(','), activeEmpresaId]);

  const downloadAttachedDoc = async (doc: AttachedDoc) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 600);
    if (error || !data?.signedUrl) {
      console.error('Erro ao obter URL assinada:', error);
      return false;
    }
    const resp = await fetch(data.signedUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_filename || `${doc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  };

  const getDocsForPolicy = (policyId: string): AttachedDoc[] => docsByPolicy[policyId] || [];

  return { docsByPolicy, loading, getDocsForPolicy, downloadAttachedDoc };
}
