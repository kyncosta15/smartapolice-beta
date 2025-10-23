import { corpClient } from "@/lib/corpClient";

interface BuscarClienteParams {
  texto?: string;
  codfil?: number;
  codigo?: number;
}

// Função auxiliar para detectar tipo de busca
function detectarTipoBusca(texto: string): 'cpf' | 'cnpj' | 'codigo' | 'nome' {
  // Remove caracteres especiais para análise
  const textoLimpo = texto.replace(/[^\d]/g, '');
  
  // Se é só números
  if (textoLimpo === texto || textoLimpo.length > 0) {
    // Se tem 11 dígitos, é CPF
    if (textoLimpo.length === 11) {
      return 'cpf';
    }
    // Se tem 14 dígitos, é CNPJ
    if (textoLimpo.length === 14) {
      return 'cnpj';
    }
    // Se tem menos de 11 dígitos e é só números, é código
    if (textoLimpo === texto && textoLimpo.length > 0 && textoLimpo.length < 11) {
      return 'codigo';
    }
  }
  
  // Caso contrário, é nome
  return 'nome';
}

export async function getClientesCorpNuvem(params?: BuscarClienteParams) {
  console.log('📡 [CorpNuvem Clientes] Iniciando requisição com params:', params);
  
  // Busca por código específico (quando já sabemos o código)
  if (params?.codfil && params?.codigo) {
    try {
      const res = await corpClient.get("/cliente", { 
        params: { 
          codfil: params.codfil,
          codigo: params.codigo 
        } 
      });
      console.log('✅ [CorpNuvem Clientes] Cliente detalhado encontrado:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('❌ [CorpNuvem Clientes] Erro:', error?.response?.data);
      throw error;
    }
  }
  
  // Busca inteligente por texto
  if (params?.texto) {
    const tipoBusca = detectarTipoBusca(params.texto);
    console.log('🔍 [CorpNuvem Clientes] Tipo de busca detectado:', tipoBusca, 'para:', params.texto);
    
    try {
      let res;
      
      if (tipoBusca === 'cpf') {
        // Busca por CPF
        const cpfLimpo = params.texto.replace(/[^\d]/g, '');
        console.log('📋 [CorpNuvem Clientes] Buscando por CPF:', cpfLimpo);
        
        try {
          res = await corpClient.get("/busca_cpf", { 
            params: { cpf: cpfLimpo } 
          });
          
          // Se retornou dados
          if (res.data?.clientes || res.data?.cliente) {
            return res.data?.clientes || res.data?.cliente || [];
          }
        } catch (cpfError: any) {
          console.warn('⚠️ [CorpNuvem Clientes] CPF não encontrado, tentando busca por nome...');
          // Se falhar, tenta buscar por nome como fallback
          res = await corpClient.get("/lista_clientes", { 
            params: { texto: params.texto } 
          });
        }
      } else if (tipoBusca === 'cnpj') {
        // Busca por CNPJ
        const cnpjLimpo = params.texto.replace(/[^\d]/g, '');
        console.log('🏢 [CorpNuvem Clientes] Buscando por CNPJ:', cnpjLimpo);
        
        try {
          res = await corpClient.get("/busca_cnpj", { 
            params: { cnpj: cnpjLimpo } 
          });
          
          if (res.data?.clientes || res.data?.cliente) {
            return res.data?.clientes || res.data?.cliente || [];
          }
        } catch (cnpjError: any) {
          console.warn('⚠️ [CorpNuvem Clientes] CNPJ não encontrado, tentando busca por nome...');
          // Se falhar, tenta buscar por nome como fallback
          res = await corpClient.get("/lista_clientes", { 
            params: { texto: params.texto } 
          });
        }
      } else if (tipoBusca === 'codigo') {
        // Busca por código
        const codigo = parseInt(params.texto);
        console.log('🔢 [CorpNuvem Clientes] Buscando por código:', codigo);
        res = await corpClient.get("/cliente", { 
          params: { 
            codfil: 1,
            codigo: codigo 
          } 
        });
        
        // O endpoint /cliente retorna um objeto, não array
        // Precisamos padronizar para array
        if (res.data?.cliente) {
          return res.data.cliente;
        }
        return [res.data];
      } else {
        // Busca por nome
        console.log('👤 [CorpNuvem Clientes] Buscando por nome:', params.texto);
        res = await corpClient.get("/lista_clientes", { 
          params: { texto: params.texto } 
        });
      }
      
      console.log('✅ [CorpNuvem Clientes] Clientes encontrados:', res.data);
      return res.data?.clientes || res.data?.cliente || [];
    } catch (error: any) {
      console.error('❌ [CorpNuvem Clientes] Erro:', error?.response?.data);
      throw error;
    }
  }
  
  throw new Error('Parâmetros inválidos. Forneça texto para busca ou codfil + codigo.');
}
