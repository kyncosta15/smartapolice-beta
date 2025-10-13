import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Ticket, TicketStats, TicketFilters, ChartData, TicketTipo, TicketStatus } from '@/types/tickets';

export function useTicketsData() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TicketFilters>({});

  // Buscar empresa do usuário
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (!user?.id) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userData?.company) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('id')
          .eq('nome', userData.company)
          .single();

        if (empresaData) {
          setEmpresaId(empresaData.id);
        }
      }
    };

    fetchEmpresaId();
  }, [user?.id]);

  // Carregar tickets
  const loadTickets = async () => {
    if (!empresaId) {
      console.log('🎫 loadTickets: empresaId não encontrado:', empresaId);
      return;
    }

    console.log('🎫 loadTickets: Iniciando busca com empresaId:', empresaId);
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          vehicle:frota_veiculos(id, placa, marca, modelo, status_seguro)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.subtipo) {
        query = query.eq('subtipo', filters.subtipo);
      }
      if (filters.busca) {
        // Buscar por placa do veículo ou descrição
        query = query.or(`descricao.ilike.%${filters.busca}%,vehicle.placa.ilike.%${filters.busca}%`);
      }

      // Filtros de período
      if (filters.periodo) {
        const hoje = new Date();
        let dataInicio;
        
        switch (filters.periodo) {
          case 'ultimos_30':
            dataInicio = new Date(hoje.setDate(hoje.getDate() - 30));
            break;
          case 'ultimos_60':
            dataInicio = new Date(hoje.setDate(hoje.getDate() - 60));
            break;
          case 'ultimos_90':
            dataInicio = new Date(hoje.setDate(hoje.getDate() - 90));
            break;
        }
        
        if (dataInicio) {
          query = query.gte('created_at', dataInicio.toISOString());
        }
      }

      if (filters.dataInicio && filters.dataFim) {
        query = query
          .gte('created_at', filters.dataInicio)
          .lte('created_at', filters.dataFim);
      }

      console.log('🎫 loadTickets: Executando query...');
      const { data, error } = await query;

      if (error) {
        console.error('🎫 Erro na query:', error);
        throw error;
      }

      console.log('🎫 loadTickets: Dados recebidos:', data?.length, 'tickets');
      console.log('🎫 loadTickets: Primeiros dados:', data?.slice(0, 2));

      // Mapear dados para o formato esperado
      const mappedTickets = (data || []).map(ticket => {
        const payload = ticket.payload as any;
        return {
          ...ticket,
          subtipo: payload?.subtipo,
          valor_estimado: payload?.valor_estimado,
          descricao: payload?.descricao,
        };
      }) as Ticket[];
      
      console.log('🎫 loadTickets: Tickets mapeados:', mappedTickets.length);
      setTickets(mappedTickets);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [empresaId, filters]);

  // Criar novo ticket
  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    if (!empresaId || !user?.id) return null;

    try {
      // Gerar código de protocolo
      const protocolCode = `TKT-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            tipo: ticketData.tipo,
            status: ticketData.status || 'aberto',
            vehicle_id: ticketData.vehicle_id,
            apolice_id: ticketData.apolice_id,
            data_evento: ticketData.data_evento,
            localizacao: ticketData.localizacao,
            origem: ticketData.origem || 'portal',
            empresa_id: empresaId,
            created_by: user.id,
            protocol_code: protocolCode,
            payload: {
              subtipo: ticketData.subtipo,
              valor_estimado: ticketData.valor_estimado,
              descricao: ticketData.descricao,
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Criar movimento inicial
      await supabase
        .from('ticket_movements')
        .insert([
          {
            ticket_id: data.id,
            tipo: 'criacao',
            descricao: `Ticket criado - ${ticketData.tipo}`,
            created_by: user.id,
          }
        ]);

      // Recarregar tickets
      await loadTickets();

      toast({
        title: "Sucesso",
        description: `${ticketData.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} criado com sucesso!`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive",
      });
      return null;
    }
  };

  // Atualizar status do ticket
  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Criar movimento
      await supabase
        .from('ticket_movements')
        .insert([
          {
            ticket_id: ticketId,
            tipo: 'status_change',
            descricao: `Status alterado para: ${newStatus}`,
            created_by: user.id,
          }
        ]);

      await loadTickets();

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  // Deletar ticket
  const deleteTicket = async (ticketId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();

      toast({
        title: "Sucesso",
        description: "Ticket deletado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o ticket",
        variant: "destructive",
      });
    }
  };

  // Calcular estatísticas
  const stats: TicketStats = useMemo(() => {
    const sinistros = tickets.filter(t => t.tipo === 'sinistro');
    const assistencias = tickets.filter(t => t.tipo === 'assistencia');
    
    // Últimos 60 dias
    const sessenta_dias_atras = new Date();
    sessenta_dias_atras.setDate(sessenta_dias_atras.getDate() - 60);
    const ultimos60Dias = tickets.filter(t => 
      new Date(t.created_at) >= sessenta_dias_atras
    );

    return {
      totalSinistros: sinistros.length,
      sinistrosAbertos: sinistros.filter(t => t.status === 'aberto').length,
      sinistrosFinalizados: sinistros.filter(t => t.status === 'finalizado').length,
      totalAssistencias: assistencias.length,
      assistenciasAbertas: assistencias.filter(t => t.status === 'aberto').length,
      assistenciasFinalizadas: assistencias.filter(t => t.status === 'finalizado').length,
      totalUltimos60Dias: ultimos60Dias.length,
    };
  }, [tickets]);

  // Dados para gráficos
  const chartData: ChartData = useMemo(() => {
    // Distribuição por subtipo
    const subtipoCount: { [key: string]: { count: number; tipo: TicketTipo } } = {};
    tickets.forEach(ticket => {
      if (ticket.subtipo) {
        if (!subtipoCount[ticket.subtipo]) {
          subtipoCount[ticket.subtipo] = { count: 0, tipo: ticket.tipo };
        }
        subtipoCount[ticket.subtipo].count++;
      }
    });

    const subtipos = Object.entries(subtipoCount).map(([name, data]) => ({
      name,
      value: data.count,
      tipo: data.tipo,
    }));

    // Tickets por mês (últimos 6 meses)
    const porMes: { [key: string]: { sinistros: number; assistencias: number } } = {};
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    tickets
      .filter(t => new Date(t.created_at) >= seisMesesAtras)
      .forEach(ticket => {
        const mes = new Date(ticket.created_at).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!porMes[mes]) {
          porMes[mes] = { sinistros: 0, assistencias: 0 };
        }
        
        if (ticket.tipo === 'sinistro') {
          porMes[mes].sinistros++;
        } else {
          porMes[mes].assistencias++;
        }
      });

    const porMesArray = Object.entries(porMes).map(([mes, dados]) => ({
      mes,
      ...dados,
    }));

    // Por categoria de veículo
    const categoriaCount: { [key: string]: number } = {};
    tickets.forEach(ticket => {
      if (ticket.vehicle?.id) {
        // Aqui você pode buscar a categoria do veículo da tabela frota_veiculos
        // Por enquanto, vamos usar uma categoria padrão
        const categoria = 'Leve'; // Isso deve vir dos dados do veículo
        categoriaCount[categoria] = (categoriaCount[categoria] || 0) + 1;
      }
    });

    const porCategoria = Object.entries(categoriaCount).map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
    }));

    return {
      subtipos,
      porMes: porMesArray,
      porCategoria,
    };
  }, [tickets]);

  return {
    tickets,
    loading,
    filters,
    setFilters,
    stats,
    chartData,
    createTicket,
    updateTicketStatus,
    deleteTicket,
    refreshTickets: loadTickets,
  };
}