import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data as Client, ...prev]);
      
      toast({
        title: "Cliente cadastrado",
        description: `${clientData.name} foi cadastrado com sucesso`,
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