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

interface FipeResponse {
  vehicle_id: string;
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

      const data: FipeResponse = await response.json();
      setResult(data);
      setFullResponse(data);

      if (data.status === 'ok') {
        toast({
          title: "FIPE padronizado com sucesso!",
          description: `Confiança: ${(data.normalized?.confidence || 0) * 100}%`,
        });
      } else if (data.status === 'review') {
        toast({
          title: "Revisar padronização",
          description: data.normalized?.reason || "Necessário revisar os dados",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na padronização",
          description: data.error || "Não foi possível padronizar o veículo",
          variant: "destructive",
        });
      }

      return data;
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
