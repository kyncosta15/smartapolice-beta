import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export type EntityType = 'GERAL' | 'VEICULO' | 'APOLICE';
export type DocCategory = 'APOLICE' | 'ENDOSSO' | 'BOLETO' | 'LAUDO' | 'CRLV' | 'CNH' | 'FOTO' | 'OUTROS';

export interface DocumentRecord {
  id: string;
  title: string;
  original_filename: string;
  file_extension: string | null;
  mime_type: string | null;
  file_size: number;
  storage_path: string;
  entity_type: EntityType;
  vehicle_id: string | null;
  policy_id: string | null;
  insurer: string | null;
  category: DocCategory;
  tags: string[] | null;
  description: string | null;
  document_date: string | null;
  created_at: string;
  // joined
  vehicle_placa?: string;
  policy_numero?: string;
}

export interface DocFilters {
  search: string;
  category: string;
  entityType: string;
  insurer: string;
}

const BUCKET = 'rcorp-docs';

function sanitizeStorageFileName(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');

  const normalizedBaseName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_\s.]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 120);

  const safeBaseName = normalizedBaseName || 'documento';
  return ext ? `${safeBaseName}.${ext}` : safeBaseName;
}

export function useDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeEmpresaId } = useTenant();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocFilters>({
    search: '',
    category: '',
    entityType: '',
    insurer: '',
  });

  const fetchDocuments = useCallback(async () => {
    if (!activeEmpresaId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('documents')
        .select('*')
        .eq('account_id', activeEmpresaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.entityType) query = query.eq('entity_type', filters.entityType);
      if (filters.insurer) query = query.ilike('insurer', `%${filters.insurer}%`);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,original_filename.ilike.%${filters.search}%,insurer.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, activeEmpresaId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    file: File,
    metadata: {
      title: string;
      entity_type: EntityType;
      category: DocCategory;
      vehicle_id?: string;
      policy_id?: string;
      insurer?: string;
      tags?: string[];
      description?: string;
      document_date?: string;
    }
  ) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const safeFileName = sanitizeStorageFileName(file.name);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    
    let pathPrefix = 'geral';
    if (metadata.entity_type === 'VEICULO' && metadata.vehicle_id) {
      pathPrefix = `veiculos/${metadata.vehicle_id}`;
    } else if (metadata.entity_type === 'APOLICE' && metadata.policy_id) {
      pathPrefix = `apolices/${metadata.policy_id}`;
    }

    const accountPrefix = activeEmpresaId || 'default';

    const storagePath = `${accountPrefix}/${pathPrefix}/${yyyy}/${mm}/${uuid}_${safeFileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Insert metadata
    const { error: insertError } = await (supabase as any)
      .from('documents')
      .insert({
        account_id: activeEmpresaId || null,
        title: metadata.title,
        original_filename: file.name,
        file_extension: ext,
        mime_type: file.type,
        file_size: file.size,
        bucket_name: BUCKET,
        storage_path: storagePath,
        entity_type: metadata.entity_type,
        vehicle_id: metadata.vehicle_id || null,
        policy_id: metadata.policy_id || null,
        insurer: metadata.insurer || null,
        category: metadata.category,
        tags: metadata.tags || null,
        description: metadata.description || null,
        document_date: metadata.document_date || null,
        uploaded_by_user_id: user?.id || null,
      });

    if (insertError) {
      // Cleanup uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw insertError;
    }
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 600); // 10 min
    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }
    return data.signedUrl;
  };

  const softDelete = async (docId: string) => {
    const { error } = await (supabase as any)
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', docId);
    if (error) throw error;
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast({ title: 'Documento excluído' });
  };

  const bulkSoftDelete = async (docIds: string[]) => {
    const results = await Promise.all(
      docIds.map(id =>
        (supabase as any)
          .from('documents')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }: any) => ({ id, error }))
      )
    );
    const failed = results.filter(r => r.error);
    const succeeded = results.filter(r => !r.error).map(r => r.id);
    setDocuments(prev => prev.filter(d => !succeeded.includes(d.id)));
    toast({
      title: `${succeeded.length} documento(s) excluído(s)`,
      ...(failed.length > 0 && { description: `${failed.length} falharam` }),
      ...(failed.length > 0 && { variant: 'destructive' as const }),
    });
  };

  const bulkUpdateCategory = async (docIds: string[], category: DocCategory) => {
    const results = await Promise.all(
      docIds.map(id =>
        (supabase as any)
          .from('documents')
          .update({ category })
          .eq('id', id)
          .then(({ error }: any) => ({ id, error }))
      )
    );
    const failed = results.filter(r => r.error);
    const succeeded = results.filter(r => !r.error).map(r => r.id);
    setDocuments(prev =>
      prev.map(d => (succeeded.includes(d.id) ? { ...d, category } : d))
    );
    toast({
      title: `${succeeded.length} documento(s) atualizado(s)`,
      ...(failed.length > 0 && { description: `${failed.length} falharam`, variant: 'destructive' as const }),
    });
  };

  return {
    documents,
    loading,
    filters,
    setFilters,
    fetchDocuments,
    uploadDocument,
    getSignedUrl,
    softDelete,
    bulkSoftDelete,
    bulkUpdateCategory,
  };
}
