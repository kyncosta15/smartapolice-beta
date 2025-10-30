import { useState, useCallback } from 'react';
import { getClientesCorpNuvem } from '@/services/corpnuvem/clientes';
import { supabase } from '@/integrations/supabase/client';

interface ClienteLookupResult {
  found: boolean;
  name: string | null;
  loading: boolean;
  error: string | null;
  alreadyRegistered: boolean;
}

export function useClienteLookup() {
  const [result, setResult] = useState<ClienteLookupResult>({
    found: false,
    name: null,
    loading: false,
    error: null,
    alreadyRegistered: false,
  });

  const searchByDocument = useCallback(async (document: string, personType: 'pf' | 'pj') => {
    const cleanDocument = document.replace(/\D/g, '');
    
    // Validar se tem o número correto de dígitos
    const expectedLength = personType === 'pf' ? 11 : 14;
    if (cleanDocument.length !== expectedLength) {
      setResult({ found: false, name: null, loading: false, error: null, alreadyRegistered: false });
      return null;
    }

    setResult({ found: false, name: null, loading: true, error: null, alreadyRegistered: false });

    try {
      console.log(`🔍 Buscando ${personType === 'pf' ? 'CPF' : 'CNPJ'}: ${cleanDocument}`);
      
      // Primeiro verificar se já está cadastrado no sistema
      const { data: existingUser, error: dbError } = await supabase
        .from('users')
        .select('id, name')
        .eq('documento', cleanDocument)
        .maybeSingle();

      if (dbError) {
        console.error('❌ Erro ao verificar documento no banco:', dbError);
      }

      if (existingUser) {
        console.log('⚠️ CPF/CNPJ já cadastrado no sistema');
        setResult({ 
          found: true, 
          name: existingUser.name, 
          loading: false, 
          error: null,
          alreadyRegistered: true 
        });
        return existingUser.name;
      }

      // Se não está cadastrado, buscar na API CorpNuvem
      const clientes = await getClientesCorpNuvem({ texto: cleanDocument });
      
      if (clientes && clientes.length > 0) {
        const cliente = clientes[0];
        const name = cliente.nome || cliente.name || null;
        
        console.log('✅ Cliente encontrado na API:', name);
        setResult({ found: true, name, loading: false, error: null, alreadyRegistered: false });
        return name;
      } else {
        console.log('❌ Cliente não encontrado na API');
        setResult({ found: false, name: null, loading: false, error: null, alreadyRegistered: false });
        return null;
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar cliente:', error);
      setResult({ 
        found: false, 
        name: null, 
        loading: false, 
        error: 'Erro ao buscar no sistema',
        alreadyRegistered: false
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult({ found: false, name: null, loading: false, error: null, alreadyRegistered: false });
  }, []);

  return {
    result,
    searchByDocument,
    reset,
  };
}
