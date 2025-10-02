import { useState } from 'react';
import { consultarFIPEComCache, type Fuel } from '@/services/fipeApiService';
import { useToast } from '@/hooks/use-toast';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuel: Fuel;
  tipoVeiculo: number;
  fipeCode?: string;
  placa?: string;
}

export function useFipeConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const consultar = async (vehicle: VehicleData, forceRefresh = false) => {
    setIsLoading(true);
    setResult(null);

    try {
      toast({
        title: "Consultando FIPE",
        description: "Buscando valor atualizado...",
      });

      const response = await consultarFIPEComCache(
        vehicle.id,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.fuel,
        vehicle.tipoVeiculo,
        vehicle.fipeCode,
        vehicle.placa
      );

      setResult(response);

      if (response.cached && !forceRefresh) {
        toast({
          title: "Valor FIPE (cache)",
          description: `Consultado há ${response.data.dias_desde_consulta} dias`,
        });
      } else {
        toast({
          title: "Valor FIPE atualizado",
          description: `Valor: ${response.data.price_label}`,
        });
      }

      return response;
    } catch (error: any) {
      console.error('Erro ao consultar FIPE:', error);
      
      toast({
        title: "Erro ao consultar FIPE",
        description: error.message || "Não foi possível obter o valor FIPE",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { consultar, isLoading, result };
}
