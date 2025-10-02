import { useState } from 'react';
import { consultarFIPEComCache, consultarModeloCandidato, type Fuel } from '@/services/fipeApiService';
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

interface Candidate {
  modelo: { Label: string; Value: number };
  score: number;
  details: string;
  valor?: string;
  fipe_code?: string;
  price_value?: number;
}

export function useFipeConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
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
      
      // Se encontrou múltiplos candidatos
      if (error.message === 'MULTIPLE_CANDIDATES' && error.candidates) {
        toast({
          title: "Modelos similares encontrados",
          description: "Escolha o modelo correto na lista abaixo",
        });
        
        // Buscar valores FIPE para cada candidato
        const candidatesWithValues = await Promise.all(
          error.candidates.map(async (c: any) => {
            try {
              const valorResult = await consultarModeloCandidato(
                c.modelo,
                error.marca,
                vehicle.year,
                vehicle.fuel,
                error.tipoVeiculo,
                error.tabelaRef
              );
              
              if (valorResult) {
                return {
                  ...c,
                  valor: valorResult.valor.Valor,
                  fipe_code: valorResult.valor.CodigoFipe,
                  price_value: parseFloat(valorResult.valor.Valor.replace(/[^0-9,]/g, '').replace(',', '.')),
                };
              }
            } catch (e) {
              console.log(`Não foi possível obter valor para ${c.modelo.Label}`);
            }
            return c;
          })
        );
        
        setCandidates(candidatesWithValues);
        return;
      }
      
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

  const selectCandidate = (candidate: Candidate) => {
    if (candidate.valor) {
      setResult({
        cached: false,
        data: {
          price_value: candidate.price_value || 0,
          price_label: candidate.valor,
          fipe_code: candidate.fipe_code,
          mes_referencia: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          data_consulta: new Date().toISOString(),
          dias_desde_consulta: 0,
        },
      });
      setCandidates([]);
    }
  };

  return { consultar, isLoading, result, candidates, selectCandidate };
}
