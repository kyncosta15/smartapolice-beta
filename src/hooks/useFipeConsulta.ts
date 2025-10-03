import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Hook para consultar FIPE via webhook N8N

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  fuel?: string;
  tipoVeiculo: number;
  fipeCode?: string;
  placa?: string;
}

interface FipeApiResponse {
  ok: boolean;
  vehicleId: string | null;
  refId: number | null;
  normalized?: {
    brand: string;
    model: string;
    yearHint: string;
    confidence: number;
    reason?: string;
  };
  plan?: any[];
  error?: string;
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
  plan?: any[];
  error?: string;
}

export function useFipeConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FipeResponse | null>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);
  const { toast } = useToast();

  const consultar = async (vehicle: VehicleData, refId?: number) => {
    setIsLoading(true);
    setResult(null);
    setFullResponse(null);

    try {
      const WEBHOOK_URL = 'https://rcorpoficial.app.n8n.cloud/webhook-test/smartapolice/fipe/llm';
      
      const payload = {
        ref_id: refId || 331,
        vehicle: {
          id: String(vehicle.id || ''),
          plate: vehicle.placa || '',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || null,
        },
      };

      console.log('Consultando FIPE via webhook:', payload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const apiData: FipeApiResponse = await response.json();
      setFullResponse(apiData);
      console.log('FIPE API Response:', apiData);

      // Mapear resposta da API para formato interno
      const mappedData: FipeResponse = {
        status: 'error', // default
        normalized: apiData.normalized ? {
          brand: apiData.normalized.brand,
          model: apiData.normalized.model,
          year_hint: apiData.normalized.yearHint,
          confidence: apiData.normalized.confidence,
          reason: apiData.normalized.reason,
        } : undefined,
        plan: apiData.plan,
        error: apiData.error,
      };

      // Determinar status baseado na presença e qualidade dos dados normalizados
      if (apiData.normalized) {
        const confidence = apiData.normalized.confidence;
        
        // Se tem dados normalizados com alta confiança, é sucesso
        if (confidence >= 0.9) {
          mappedData.status = 'ok';
        } 
        // Se tem dados mas com confiança baixa, precisa revisar
        else if (confidence >= 0.5) {
          mappedData.status = 'review';
        }
        // Confiança muito baixa = erro
        else {
          mappedData.status = 'error';
        }
      } else {
        // Sem dados normalizados = erro
        mappedData.status = 'error';
      }

      console.log('Mapped FIPE data:', mappedData);
      setResult(mappedData);

      if (mappedData.status === 'ok') {
        toast({
          title: "FIPE padronizado com sucesso!",
          description: `Confiança: ${(mappedData.normalized?.confidence || 0) * 100}%`,
        });
      } else if (mappedData.status === 'review') {
        toast({
          title: "Revisar padronização",
          description: mappedData.normalized?.reason || "Necessário revisar os dados",
          variant: "default",
        });
      } else {
        const errorMessage = mappedData.error === 'MISSING_FIELDS' 
          ? 'Campos obrigatórios faltando (marca, modelo ou ano)'
          : mappedData.error || 'Não foi possível padronizar o veículo';
        
        toast({
          title: "Erro na padronização",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return mappedData;
    } catch (error: any) {
      console.error('Erro ao consultar FIPE:', error);
      
      toast({
        title: "Erro ao consultar FIPE",
        description: error.message || "Falha na conexão com o webhook",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { consultar, isLoading, result, fullResponse };
}
