import { useState } from 'react';
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

export function useFipeConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FipeResponse | null>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);
  const { toast } = useToast();

  const consultar = async (vehicle: VehicleData, refId?: number) => {
    if (!vehicle.fipeCode) {
      toast({
        title: "Código FIPE obrigatório",
        description: "É necessário informar o código FIPE do veículo",
        variant: "destructive",
      });
      return;
    }

    if (!vehicle.year) {
      toast({
        title: "Ano obrigatório",
        description: "É necessário informar o ano do modelo do veículo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setFullResponse(null);

    try {
      console.log('=== Consultando FIPE v2 via edge function ===');
      console.log('Veículo:', vehicle);
      console.log('RefId:', refId);

      // Mapear categoria para vehicleType (usando as 3 categorias padronizadas)
      let vehicleType = vehicle.vehicleType;
      
      if (!vehicleType && vehicle.categoria) {
        // Mapeamento direto das 3 categorias padronizadas
        if (vehicle.categoria === "Carros") {
          vehicleType = "cars";
        } else if (vehicle.categoria === "Caminhão") {
          vehicleType = "trucks";
        } else if (vehicle.categoria === "Moto") {
          vehicleType = "motorcycles";
        } else {
          // Fallback: normalizar para compatibilidade retroativa
          const cat = vehicle.categoria
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          console.log(`Hook: Mapping legacy category "${vehicle.categoria}" -> normalized: "${cat}"`);
          
          if (cat.includes('caminh') || cat.includes('truck')) {
            vehicleType = 'trucks';
          } else if (cat.includes('moto')) {
            vehicleType = 'motorcycles';
          } else {
            vehicleType = 'cars'; // Default para carros
          }
        }
      }
      
      console.log(`Hook: Final vehicleType: ${vehicleType}`);

      const payload = {
        fipeCode: vehicle.fipeCode,
        year: vehicle.year,
        plate: vehicle.placa,
        reference: refId,
        category: vehicle.categoria,
        vehicleType: vehicleType
      };

      console.log('Payload para edge function:', payload);

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke<FipeEdgeFunctionResponse>(
        'get-fipe-by-code-year',
        { body: payload }
      );

      if (edgeError) {
        console.error('Erro na edge function:', edgeError);
        throw new Error(edgeError.message || 'Erro ao consultar FIPE');
      }

      console.log('Resposta da edge function:', edgeData);
      setFullResponse(edgeData);

      if (!edgeData || !edgeData.ok) {
        const errorMsg = edgeData?.error?.message || 'Erro desconhecido ao consultar FIPE';
        console.error('Erro retornado pela API:', errorMsg);

        const mappedError: FipeResponse = {
          status: 'error',
          error: errorMsg
        };

        setResult(mappedError);

        toast({
          title: "Erro ao consultar FIPE",
          description: "Verifique se o código FIPE ou categoria do veículo está correto, tente novamente.",
          variant: "destructive",
        });

        return mappedError;
      }

      // Mapear resposta para formato interno
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

      console.log('Dados mapeados:', mappedData);
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
    }
  };

  return { consultar, isLoading, result, fullResponse };
}
