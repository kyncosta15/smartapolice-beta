import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatusEvent, TicketType } from '@/types/status-stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Interface para tickets compatível com a estrutura existente
interface Ticket {
  id: string;
  empresa_id?: string;
  tipo: TicketType;
  vehicle_id?: string;
  apolice_id?: string;
  titulo: string;
  descricao?: string;
  status: string;
  sla_due_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface UseStatusStepperDataProps {
  ticketId?: string;
}

export const useStatusStepperData = ({ ticketId }: UseStatusStepperDataProps = {}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Simular dados para demonstração
  const fetchTicketData = async (id: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Criar dados de demonstração
      const mockTicket: Ticket = {
        id,
        tipo: 'sinistro',
        titulo: 'Ticket de Demonstração',
        descricao: 'Este é um ticket de exemplo para demonstrar a funcionalidade',
        status: 'aberto',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTicket(mockTicket);
      
      // Criar histórico mock
      const mockHistory: StatusEvent[] = [
        {
          id: '1',
          ticket_id: id,
          to_status: 'aberto',
          note: 'Ticket criado',
          changed_by: user.id,
          created_at: new Date().toISOString(),
          user_name: user.name || 'Usuário'
        }
      ];
      setHistory(mockHistory);
      
    } catch (err: any) {
      console.error('Erro ao buscar dados do ticket:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Alterar status do ticket
  const changeStatus = async (
    ticketId: string, 
    newStatus: string, 
    note?: string, 
    attachments?: File[]
  ) => {
    if (!user || !ticket) throw new Error('Usuário não autenticado');

    // Upload de arquivos primeiro, se houver
    const uploadedAttachments: { name: string; url: string; size: number }[] = [];
    
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `tickets/${ticketId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('smartapolice')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('smartapolice')
          .getPublicUrl(filePath);

        uploadedAttachments.push({
          name: file.name,
          url: publicUrl,
          size: file.size
        });
      }
    }

    // Para demonstração, apenas simular atualização local

    // Adicionar evento ao histórico local
    const newEvent: StatusEvent = {
      id: Date.now().toString(),
      ticket_id: ticketId,
      from_status: ticket.status,
      to_status: newStatus,
      note: note || undefined,
      attachments: uploadedAttachments,
      changed_by: user.id,
      created_at: new Date().toISOString(),
      user_name: user.name || 'Usuário'
    };

    setHistory(prev => [...prev, newEvent]);
    setTicket(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);

    toast({
      title: "Status atualizado",
      description: `Ticket movido para: ${newStatus}`,
    });
  };

  // Buscar empresa do usuário atual
  const getUserCompanyId = async () => {
    if (!user) return null;
    
    const { data: userData } = await supabase
      .from('users')
      .select('company')
      .eq('id', user.id)
      .single();

    if (!userData?.company) return null;

    const { data: empresaData } = await supabase
      .from('empresas')
      .select('id')
      .eq('nome', userData.company)
      .single();

    return empresaData?.id || null;
  };

  // Criar novo ticket
  const createTicket = async (ticketData: {
    tipo: TicketType;
    titulo: string;
    descricao?: string;
    vehicle_id?: string;
    apolice_id?: string;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');

    const empresaId = await getUserCompanyId();
    
    const newTicket: Ticket = {
      id: Date.now().toString(), // Simulando ID único
      ...ticketData,
      empresa_id: empresaId || undefined,
      status: 'aberto',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Para demonstração, vamos simular a criação
    toast({
      title: "Ticket criado",
      description: `Novo ticket: ${ticketData.titulo}`,
    });

    return newTicket;
  };

  // Buscar todos os tickets da empresa (simulado)
  const fetchCompanyTickets = async (type?: TicketType) => {
    if (!user) return [];

    // Para demonstração, retornar array vazio
    // Em produção, buscar da tabela adequada
    const { data } = await supabase
      .from('request_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    return data || [];
  };

  // Efeito para buscar dados quando ticketId muda
  useEffect(() => {
    if (ticketId && user) {
      fetchTicketData(ticketId);
    }
  }, [ticketId, user]);

  return {
    ticket,
    history,
    loading,
    error,
    changeStatus,
    createTicket,
    fetchTicketData,
    fetchCompanyTickets,
    refetch: () => ticketId && fetchTicketData(ticketId)
  };
};