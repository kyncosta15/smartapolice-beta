
import { useState, useEffect, useCallback } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';

interface PolicyDataFetchOptions {
  policyId?: string;
  fileName?: string;
  maxRetries?: number;
  retryInterval?: number;
}

interface PolicyDataResponse {
  success: boolean;
  data?: ParsedPolicyData;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function usePolicyDataFetch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Simular endpoint do n8n para buscar dados processados
  const N8N_DATA_ENDPOINT = 'https://beneficiosagente.app.n8n.cloud/webhook-data';

  const fetchPolicyData = useCallback(async (
    options: PolicyDataFetchOptions
  ): Promise<PolicyDataResponse> => {
    const { policyId, fileName, maxRetries = 10, retryInterval = 3000 } = options;
    
    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt + 1}/${maxRetries} - Buscando dados processados...`);
        
        // Simular resposta do n8n com diferentes status
        const mockResponse = await simulateN8NResponse(policyId, fileName, attempt);
        
        if (mockResponse.status === 'completed' && mockResponse.data) {
          setIsLoading(false);
          toast({
            title: "✅ Dados Extraídos",
            description: `${mockResponse.data.name} processado com sucesso`,
          });
          return mockResponse;
        }

        if (mockResponse.status === 'failed') {
          throw new Error(mockResponse.error || 'Falha no processamento');
        }

        // Se ainda está processando, aguarda antes da próxima tentativa
        if (attempt < maxRetries - 1) {
          console.log(`Status: ${mockResponse.status}. Aguardando ${retryInterval}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }

      } catch (err) {
        console.error(`Erro na tentativa ${attempt + 1}:`, err);
        
        if (attempt === maxRetries - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          setError(errorMessage);
          setIsLoading(false);
          
          toast({
            title: "❌ Erro na Extração",
            description: `Falha após ${maxRetries} tentativas: ${errorMessage}`,
            variant: "destructive",
          });
          
          return {
            success: false,
            status: 'failed',
            error: errorMessage
          };
        }
        
        // Aguarda antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }

    const timeoutError = 'Timeout: Dados não processados após múltiplas tentativas';
    setError(timeoutError);
    setIsLoading(false);
    
    return {
      success: false,
      status: 'failed',
      error: timeoutError
    };
  }, [toast]);

  return {
    fetchPolicyData,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

// Simular diferentes respostas do n8n baseado na tentativa
async function simulateN8NResponse(
  policyId?: string, 
  fileName?: string, 
  attempt: number = 0
): Promise<PolicyDataResponse> {
  
  // Simular diferentes status baseado na tentativa
  if (attempt < 2) {
    return {
      success: false,
      status: 'pending',
      error: 'Aguardando início do processamento'
    };
  }
  
  if (attempt < 4) {
    return {
      success: false,
      status: 'processing',
      error: 'IA analisando documento...'
    };
  }

  // Simular falha ocasional
  if (attempt === 4 && Math.random() < 0.3) {
    return {
      success: false,
      status: 'failed',
      error: 'Falha temporária na extração'
    };
  }

  // Dados processados com sucesso
  const mockData: ParsedPolicyData = {
    id: `processed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: fileName?.replace('.pdf', '') || 'Apólice Processada',
    type: ['auto', 'vida', 'saude', 'patrimonial'][Math.floor(Math.random() * 4)],
    insurer: ['Mapfre', 'Porto Seguro', 'SulAmérica', 'Bradesco Seguros'][Math.floor(Math.random() * 4)],
    premium: Math.floor(Math.random() * 5000) + 1000,
    monthlyAmount: Math.floor(Math.random() * 500) + 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    policyNumber: `POL-${Math.floor(Math.random() * 900000) + 100000}`,
    paymentFrequency: 'mensal',
    status: 'active',
    totalCoverage: Math.floor(Math.random() * 200000) + 50000,
    deductible: Math.floor(Math.random() * 5000) + 1000,
    claimRate: Math.floor(Math.random() * 20) + 1,
    installments: [
      { valor: 250, data: new Date().toISOString().split('T')[0] },
      { valor: 250, data: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ],
    paymentMethod: ['boleto', 'cartao', 'debito'][Math.floor(Math.random() * 3)],
    extractedAt: new Date().toISOString()
  };

  return {
    success: true,
    status: 'completed',
    data: mockData
  };
}
