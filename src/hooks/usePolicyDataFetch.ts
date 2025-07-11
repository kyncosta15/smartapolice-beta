import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useAuth } from '@/contexts/AuthContext';
import { PolicyPersistenceService } from '@/services/policyPersistenceService';
import { useToast } from '@/hooks/use-toast';
import crypto from 'crypto';

// Mock data for development purposes
const mockPolicyData: ParsedPolicyData = {
  id: crypto.randomUUID(),
  name: `Apólice de Seguro ${Math.floor(Math.random() * 1000)}`,
  type: 'auto',
  insurer: 'Seguradora Exemplo',
  premium: 1200,
  monthlyAmount: 150,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  policyNumber: `POL-${Date.now()}`,
  paymentFrequency: 'monthly',
  status: 'active',
  extractedAt: new Date().toISOString(),
  
  // NOVOS CAMPOS OBRIGATÓRIOS
  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  policyStatus: 'vigente',
  
  // Campos opcionais
  installments: [],
  coberturas: [],
  entity: 'Corretora Exemplo',
  category: 'Veicular',
  coverage: ['Cobertura Básica'],
  totalCoverage: 1200
};

export function usePolicyDataFetch() {
  const [policyData, setPolicyData] = useState<ParsedPolicyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPolicyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate fetching data based on user authentication
        if (user) {
          // Replace with actual API call to fetch policy data
          setPolicyData(mockPolicyData);
        } else {
          setError('User not authenticated');
          toast({
            title: "Erro de Autenticação",
            description: "Usuário não autenticado",
            variant: "destructive",
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch policy data';
        setError(errorMessage);
        toast({
          title: "Erro ao Carregar Dados",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicyData();
  }, [user, toast]);

  return { policyData, isLoading, error };
}
