import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getClientesCorpNuvem } from '@/services/corpnuvem/clientes';
import { getClienteAnexos } from '@/services/corpnuvem/anexos';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  document_type: 'cpf' | 'cnpj';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  pdf_url?: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  document_type: 'cpf' | 'cnpj';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  pdf_url?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data as Client[] || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (clientData: CreateClientData) => {
    try {
      setIsLoading(true);
      setError(null);

      let pdfUrl: string | undefined = undefined;

      // Buscar URL do documento_anexo se tiver documento
      if (clientData.document) {
        try {
          console.log('🔍 Buscando documento_anexo para:', clientData.document);
          
          // Buscar cliente na CorpNuvem
          const clientes = await getClientesCorpNuvem({ texto: clientData.document });
          
          if (clientes && clientes.length > 0) {
            const cliente = Array.isArray(clientes) ? clientes[0] : clientes;
            const clienteCodigo = cliente.codigo;
            
            console.log('✅ Cliente encontrado:', clienteCodigo);
            
            // Buscar anexos do cliente
            const anexosData = await getClienteAnexos({
              codfil: 1,
              codigo: clienteCodigo
            });
            
            // Procurar primeiro PDF
            if (anexosData?.anexos && anexosData.anexos.length > 0) {
              const pdfAnexo = anexosData.anexos.find((anexo: any) => 
                anexo.tipo?.toLowerCase().includes('pdf') || 
                anexo.nome?.toLowerCase().includes('pdf')
              );
              
              if (pdfAnexo) {
                pdfUrl = pdfAnexo.url;
                console.log('📄 PDF encontrado:', pdfUrl);
              }
            }
          }
        } catch (anexoError) {
          console.warn('⚠️ Não foi possível buscar documento_anexo:', anexoError);
          // Continua o cadastro mesmo se falhar a busca do anexo
        }
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, pdf_url: pdfUrl }])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data as Client, ...prev]);
      
      toast({
        title: "Cliente cadastrado",
        description: pdfUrl 
          ? `${clientData.name} foi cadastrado com sucesso (PDF encontrado)`
          : `${clientData.name} foi cadastrado com sucesso`,
      });

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: string, updates: Partial<CreateClientData>) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === id ? data as Client : client
      ));

      toast({
        title: "Cliente atualizado",
        description: "Dados do cliente foram atualizados com sucesso",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));

      toast({
        title: "Cliente removido",
        description: "Cliente foi removido com sucesso",
      });

      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    fetchClients
  };
};