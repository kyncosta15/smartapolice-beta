import { corpClient } from "@/lib/corpClient";

interface BuscarClienteParams {
  nome?: string;
  codfil?: number;
  codigo?: number;
}

export async function getClientesCorpNuvem(params?: BuscarClienteParams) {
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
  
  const res = await corpClient.get("/cliente", { params: queryParams });
  
  // A API retorna um objeto com array de clientes ou um único cliente
  // Normalizamos para sempre retornar um array
  if (Array.isArray(res.data)) {
    return res.data;
  }
  
  return [res.data];
}
