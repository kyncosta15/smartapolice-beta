import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FleetRequestDocument {
  id: string;
  request_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  created_at: string;
}

export function useFleetRequestDocuments(requestId: string | null) {
  const [documents, setDocuments] = useState<FleetRequestDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('fleet_request_documents')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setDocuments(data || []);
      } catch (err) {
        console.error('Error fetching fleet request documents:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar documentos');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [requestId]);

  return {
    documents,
    loading,
    error,
    refetch: () => {
      if (requestId) {
        // Re-trigger the effect
        setDocuments([]);
      }
    }
  };
}