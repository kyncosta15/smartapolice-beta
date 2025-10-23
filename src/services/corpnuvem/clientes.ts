import { corpClient } from "@/lib/corpClient";

interface BuscarClienteParams {
  nome?: string;
  codfil?: number;
  codigo?: number;
}

export async function getClientesCorpNuvem(params?: BuscarClienteParams) {
  console.log('📡 [CorpNuvem Service] Iniciando requisição com params:', params);
  
  const queryParams: Record<string, any> = {};
  
  // Se passou nome para buscar
  if (params?.nome) {
    queryParams.nome = params.nome;
  }
  
  // Se passou código de filial e código do cliente
  if (params?.codfil !== undefined) {
    queryParams.codfil = params.codfil;
  }
  
  if (params?.codigo !== undefined) {
    queryParams.codigo = params.codigo;
  }
  
  // Se não passou nenhum parâmetro, busca com filtro padrão
  if (Object.keys(queryParams).length === 0) {
    queryParams.codfil = 1; // Filial padrão
  }
  
  console.log('📡 [CorpNuvem Service] Query params finais:', queryParams);
  
  try {
    const res = await corpClient.get("/cliente", { params: queryParams });
    
    console.log('📡 [CorpNuvem Service] Resposta recebida:', res.data);
    
    // A API retorna um objeto com array de clientes ou um único cliente
    // Normalizamos para sempre retornar um array
    if (Array.isArray(res.data)) {
      return res.data;
    }
    
    return [res.data];
  } catch (error: any) {
    console.error('📡 [CorpNuvem Service] Erro na requisição:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error;
  }
}
