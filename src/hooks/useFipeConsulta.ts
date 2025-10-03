import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { consultarFIPEComCache } from '@/services/fipeApiService';

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
  fipeValue?: {
    price_value: number;
    price_label: string;
    fipe_code?: string;
    mes_referencia: string;
    data_consulta: string;
    cached: boolean;
    used_year?: number;
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

      // Se dados foram normalizados com sucesso, consultar valor FIPE
      if (mappedData.status === 'ok' && apiData.normalized) {
        try {
          console.log('Consultando valor FIPE com dados normalizados...');
          
          const yearNum = parseInt(apiData.normalized.yearHint.split('-')[0], 10);
          const fuelType = vehicle.fuel || 'gasolina';
          
          let fipeResult = null;
          let usedYear = yearNum;
          
          try {
            // Tentar com o ano original
            fipeResult = await consultarFIPEComCache(
              vehicle.id,
              apiData.normalized.brand,
              apiData.normalized.model,
              yearNum,
              fuelType as any,
              vehicle.tipoVeiculo,
              vehicle.fipeCode,
              vehicle.placa
            );
          } catch (yearError: any) {
            // Se falhar por ano indisponível, tentar com anos próximos
            const errorMsg = yearError?.message || '';
            const yearsMatch = errorMsg.match(/Anos disponíveis próximos: ([\d, ]+)/);
            
            if (yearsMatch) {
              const availableYears = yearsMatch[1].split(',').map((y: string) => parseInt(y.trim(), 10));
              console.log('Tentando anos próximos:', availableYears);
              
              // Tentar cada ano próximo em ordem
              for (const tryYear of availableYears) {
                try {
                  fipeResult = await consultarFIPEComCache(
                    vehicle.id,
                    apiData.normalized.brand,
                    apiData.normalized.model,
                    tryYear,
                    fuelType as any,
                    vehicle.tipoVeiculo,
                    vehicle.fipeCode,
                    vehicle.placa
                  );
                  usedYear = tryYear;
                  console.log(`Sucesso com ano ${tryYear}`);
                  break;
                } catch (e) {
                  console.log(`Falhou com ano ${tryYear}, tentando próximo...`);
                  continue;
                }
              }
            }
            
            if (!fipeResult) {
              throw yearError;
            }
          }

          if (fipeResult) {
            console.log('Valor FIPE obtido:', fipeResult);

            // Adicionar valor FIPE ao resultado
            mappedData.fipeValue = {
              price_value: fipeResult.data.price_value,
              price_label: fipeResult.data.price_label,
              fipe_code: fipeResult.data.fipe_code,
              mes_referencia: fipeResult.data.mes_referencia,
              data_consulta: fipeResult.data.data_consulta,
              cached: fipeResult.cached,
              used_year: usedYear !== yearNum ? usedYear : undefined,
            };

            setResult({ ...mappedData });
          }
        } catch (fipeError: any) {
          console.error('Erro ao consultar valor FIPE:', fipeError);
          
          // Verificar se o erro tem informação sobre anos disponíveis
          const errorMsg = fipeError?.message || '';
          const hasAvailableYears = errorMsg.includes('Anos disponíveis');
          
          if (hasAvailableYears) {
            // Extrair anos disponíveis da mensagem de erro
            const yearsMatch = errorMsg.match(/Anos disponíveis próximos: ([\d, ]+)/);
            const availableYears = yearsMatch ? yearsMatch[1] : '';
            
            mappedData.error = `Ano ${apiData.normalized.yearHint.split('-')[0]} não disponível na FIPE para este modelo.${availableYears ? ` Anos próximos: ${availableYears}` : ''}`;
          } else {
            mappedData.error = 'Não foi possível consultar o valor FIPE';
          }
          
          setResult({ ...mappedData });
        }
      }

      if (mappedData.status === 'ok') {
        const hasValue = mappedData.fipeValue?.price_label;
        toast({
          title: hasValue ? "Valor FIPE encontrado!" : "Dados normalizados",
          description: hasValue 
            ? `Valor: ${mappedData.fipeValue?.price_label}` 
            : mappedData.error || `Confiança: ${(mappedData.normalized?.confidence || 0) * 100}%`,
          variant: hasValue ? "default" : "destructive",
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
