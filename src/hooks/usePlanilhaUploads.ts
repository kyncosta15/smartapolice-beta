import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlanilhaUpload {
  id: string;
  user_id: string;
  empresa_id?: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  caminho_storage: string;
  tipo_arquivo: string;
  status: 'processando' | 'processado' | 'erro' | 'cancelado';
  colaboradores_importados: number;
  dependentes_importados: number;
  data_upload: string;
  data_processamento?: string;
  created_at: string;
  updated_at: string;
}

export const usePlanilhaUploads = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<PlanilhaUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploads = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('planilhas_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data?.map((item: any) => ({
        ...item,
        status: item.status as PlanilhaUpload['status']
      })) || []);
    } catch (err: any) {
      console.error('Erro ao buscar uploads:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createUpload = async (
    file: File,
    storagePath: string,
    empresaId?: string
  ): Promise<{ data: PlanilhaUpload | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }

    try {
      const { data, error } = await supabase
        .from('planilhas_uploads')
        .insert([{
          user_id: user.id,
          empresa_id: empresaId,
          nome_arquivo: file.name,
          tamanho_arquivo: file.size,
          caminho_storage: storagePath,
          tipo_arquivo: file.type,
          status: 'processando'
        }])
        .select()
        .single();

      if (error) throw error;
      
      return { data: { ...data, status: data.status as PlanilhaUpload['status'] } as PlanilhaUpload, error: null };
    } catch (err: any) {
      console.error('Erro ao criar upload:', err);
      return { data: null, error: err.message };
    }
  };

  const updateUploadStatus = async (
    uploadId: string,
    status: PlanilhaUpload['status'],
    colaboradoresImportados?: number,
    dependentesImportados?: number
  ): Promise<{ error: string | null }> => {
    try {
      const updateData: any = { 
        status,
        data_processamento: status === 'processado' ? new Date().toISOString() : null
      };

      if (colaboradoresImportados !== undefined) {
        updateData.colaboradores_importados = colaboradoresImportados;
      }
      if (dependentesImportados !== undefined) {
        updateData.dependentes_importados = dependentesImportados;
      }

      const { error } = await supabase
        .from('planilhas_uploads')
        .update(updateData)
        .eq('id', uploadId);

      if (error) throw error;
      
      // Atualizar estado local
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, ...updateData }
          : upload
      ));

      return { error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      return { error: err.message };
    }
  };

  const deleteUpload = async (uploadId: string): Promise<{ error: string | null }> => {
    try {
      // Buscar dados do upload para deletar arquivo do storage
      const upload = uploads.find(u => u.id === uploadId);
      if (upload) {
        // Deletar arquivo do storage
        const { error: storageError } = await supabase.storage
          .from('smartbeneficios')
          .remove([upload.caminho_storage]);

        if (storageError) {
          console.warn('Erro ao deletar arquivo do storage:', storageError);
        }
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('planilhas_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;
      
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      return { error: null };
    } catch (err: any) {
      console.error('Erro ao deletar upload:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [user]);

  return {
    uploads,
    isLoading,
    error,
    fetchUploads,
    createUpload,
    updateUploadStatus,
    deleteUpload
  };
};