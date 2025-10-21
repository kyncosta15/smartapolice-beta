import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleTicketCount {
  [vehicleId: string]: number;
}

export function useVehicleTickets(vehicleIds: string[]) {
  const [ticketCounts, setTicketCounts] = useState<VehicleTicketCount>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicleIds.length === 0) {
      setTicketCounts({});
      return;
    }

    loadTicketCounts();
  }, [vehicleIds]);

  const loadTicketCounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('vehicle_id')
        .in('vehicle_id', vehicleIds);

      if (error) throw error;

      // Contar tickets por veículo
      const counts: VehicleTicketCount = {};
      data?.forEach((ticket) => {
        if (ticket.vehicle_id) {
          counts[ticket.vehicle_id] = (counts[ticket.vehicle_id] || 0) + 1;
        }
      });

      setTicketCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar contagem de tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTicketCount = (vehicleId: string): number => {
    return ticketCounts[vehicleId] || 0;
  };

  return { ticketCounts, loading, getTicketCount };
}
