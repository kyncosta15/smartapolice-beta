import { useState, useCallback } from 'react';
import { getClientesCorpNuvem } from '@/services/corpnuvem/clientes';

interface ClienteLookupResult {
  found: boolean;
  name: string | null;
  loading: boolean;
  error: string | null;
}

export function useClienteLookup() {
  const [result, setResult] = useState<ClienteLookupResult>({
    found: false,
    name: null,
    loading: false,
    error: null,
  });

  const searchByDocument = useCallback(async (document: string, personType: 'pf' | 'pj') => {
    const cleanDocument = document.replace(/\D/g, '');
    
    // Validar se tem o número correto de dígitos
    const expectedLength = personType === 'pf' ? 11 : 14;
    if (cleanDocument.length !== expectedLength) {
      setResult({ found: false, name: null, loading: false, error: null });
      return null;
    }

    setResult({ found: false, name: null, loading: true, error: null });

    try {
      console.log(`🔍 Buscando ${personType === 'pf' ? 'CPF' : 'CNPJ'}: ${cleanDocument}`);
      
      const clientes = await getClientesCorpNuvem({ texto: cleanDocument });
      
      if (clientes && clientes.length > 0) {
        const cliente = clientes[0];
        const name = cliente.nome || cliente.name || null;
        
        console.log('✅ Cliente encontrado:', name);
        setResult({ found: true, name, loading: false, error: null });
        return name;
      } else {
        console.log('❌ Cliente não encontrado no sistema');
        setResult({ found: false, name: null, loading: false, error: null });
        return null;
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar cliente:', error);
      setResult({ 
        found: false, 
        name: null, 
        loading: false, 
        error: 'Erro ao buscar no sistema' 
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult({ found: false, name: null, loading: false, error: null });
  }, []);

  return {
    result,
    searchByDocument,
    reset,
  };
}
