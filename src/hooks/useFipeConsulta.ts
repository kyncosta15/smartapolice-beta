import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Hook para consultar FIPE via edge function get-fipe-by-code-year

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  fuel?: string;
  tipoVeiculo: number;
  fipeCode?: string;
  placa?: string;
  categoria?: string;
  vehicleType?: "cars" | "motorcycles" | "trucks";
}

interface FipeEdgeFunctionResponse {
  ok: boolean;
  request?: {
    vehicleType: string;
    fipeCode: string;
    yearId: string;
    reference?: number;
  };
  data?: {
    brand: string | null;
    codeFipe: string | null;
    model: string | null;
    modelYear: number | null;
    fuel: string | null;
    fuelAcronym: string | null;
    priceFormatted: string | null;
    priceNumber: number | null;
    referenceMonth: string | null;
    vehicleType: number | null;
    priceHistory: Array<{
      month: string | null;
      priceFormatted: string | null;
      priceNumber: number | null;
      reference: string | null;
    }>;
  };
  error?: {
    status: number;
    message: string;
    details?: string;
  };
}

interface FipeResponse {
  status: 'ok' | 'review' | 'error';
  normalized?: {
    brand: string;
    model: string;
    year_hint: string;
    confidence: number;
    reason?: string;
  };
  fipeValue?: {
    price_value: number;
    price_label: string;
    fipe_code?: string;
    mes_referencia: string;
    data_consulta: string;
    cached: boolean;
    used_year?: number;
  };
  priceHistory?: Array<{
    month: string | null;
    priceFormatted: string | null;
    priceNumber: number | null;
    reference: string | null;
  }>;
  error?: string;
}

function resolveVehicleType(vehicleType?: string, categoria?: string): "cars" | "motorcycles" | "trucks" {
  if (vehicleType === "cars" || vehicleType === "motorcycles" || vehicleType === "trucks") {
    return vehicleType;
  }

  if (!categoria) return "cars";

  if (categoria === "Carros") return "cars";
  if (categoria === "Caminhão") return "trucks";
  if (categoria === "Moto") return "motorcycles";

  const cat = categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (cat.includes('caminh') || cat.includes('truck')) return 'trucks';
  if (cat.includes('moto')) return 'motorcycles';
  return 'cars';
}

export function useFipeConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FipeResponse | null>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);
  const { toast } = useToast();
  const isRunningRef = useRef(false);
  const callCountRef = useRef(0);

  const reset = useCallback(() => {
    setResult(null);
    setFullResponse(null);
    isRunningRef.current = false;
  }, []);

  const consultar = useCallback(async (vehicle: VehicleData, refId?: number) => {
    // Prevenir chamadas concorrentes
    if (isRunningRef.current) {
      console.log('[useFipeConsulta] Consulta já em andamento, ignorando');
      return null;
    }

    if (!vehicle.fipeCode) {
      toast({
        title: "Código FIPE obrigatório",
        description: "É necessário informar o código FIPE do veículo",
        variant: "destructive",
      });
      return null;
    }

    if (!vehicle.year) {
      toast({
        title: "Ano obrigatório",
        description: "É necessário informar o ano do modelo do veículo",
        variant: "destructive",
      });
      return null;
    }

    isRunningRef.current = true;
    callCountRef.current += 1;
    const thisCall = callCountRef.current;

    setIsLoading(true);
    setResult(null);
    setFullResponse(null);

    try {
      // Delay progressivo: a cada 5 consultas seguidas, adicionar 500ms de pausa
      // para não estourar rate limit da API FIPE
      if (thisCall > 1) {
        const delay = Math.min((thisCall - 1) * 100, 1000);
        console.log(`[useFipeConsulta] Delay de ${delay}ms (consulta #${thisCall})`);
        await new Promise(r => setTimeout(r, delay));
      }

      const vehicleType = resolveVehicleType(vehicle.vehicleType, vehicle.categoria);

      const payload = {
        fipeCode: vehicle.fipeCode,
        year: vehicle.year,
        plate: vehicle.placa,
        reference: refId,
        category: vehicle.categoria,
        vehicleType
      };

      console.log('[useFipeConsulta] Payload:', payload);

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke<FipeEdgeFunctionResponse>(
        'get-fipe-by-code-year',
        { body: payload }
      );

      // Se outra chamada foi iniciada enquanto esta rodava, descartar resultado
      if (callCountRef.current !== thisCall) {
        console.log('[useFipeConsulta] Chamada obsoleta, descartando resultado');
        return null;
      }

      if (edgeError) {
        console.error('Erro na edge function:', edgeError);
        throw new Error(edgeError.message || 'Erro ao consultar FIPE');
      }

      setFullResponse(edgeData);

      if (!edgeData || !edgeData.ok) {
        const errorMsg = edgeData?.error?.message || 'Erro desconhecido ao consultar FIPE';

        const mappedError: FipeResponse = { status: 'error', error: errorMsg };
        setResult(mappedError);

        toast({
          title: "Erro ao consultar FIPE",
          description: "Verifique se o código FIPE ou categoria do veículo está correto, tente novamente.",
          variant: "destructive",
        });

        return mappedError;
      }

      const fipeData = edgeData.data!;
      const mappedData: FipeResponse = {
        status: 'ok',
        normalized: {
          brand: fipeData.brand || vehicle.brand,
          model: fipeData.model || vehicle.model,
          year_hint: `${fipeData.modelYear || vehicle.year}-0`,
          confidence: 1.0,
        },
        fipeValue: fipeData.priceFormatted ? {
          price_value: fipeData.priceNumber || 0,
          price_label: fipeData.priceFormatted,
          fipe_code: fipeData.codeFipe || vehicle.fipeCode,
          mes_referencia: fipeData.referenceMonth || '',
          data_consulta: new Date().toISOString(),
          cached: false,
        } : undefined,
        priceHistory: fipeData.priceHistory
      };

      setResult(mappedData);

      if (mappedData.fipeValue) {
        toast({
          title: "Valor FIPE encontrado!",
          description: `Valor: ${mappedData.fipeValue.price_label}`,
        });
      } else {
        toast({
          title: "Dados obtidos",
          description: "Valor FIPE não disponível para este veículo",
          variant: "default",
        });
      }

      return mappedData;
    } catch (error: any) {
      console.error('Erro ao consultar FIPE:', error);

      const errorResult: FipeResponse = {
        status: 'error',
        error: error.message || 'Falha na consulta FIPE'
      };

      setResult(errorResult);

      toast({
        title: "Erro ao consultar FIPE",
        description: "Verifique se o código FIPE ou categoria do veículo está correto, tente novamente.",
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsLoading(false);
      isRunningRef.current = false;
    }
  }, [toast]);

  return { consultar, isLoading, result, fullResponse, reset };
}
