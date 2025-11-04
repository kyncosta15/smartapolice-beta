import { corpClient } from "@/lib/corpClient";

interface BuscarItensParams {
  codfil: number;
  nosnum: number;
}

interface Garantia {
  seguradora: string;
  ramo: string;
  garantia: string;
  impseg: number;
  taxa: number;
  premio: number;
  percom: number;
  valcom: number;
  agrucom: string | null;
  valfran: number;
  franquia: string;
}

interface Item {
  codfil: number;
  nosnum: number;
  item: number;
  cancelado: string;
  inivig: string;
  numend: string;
  telram: number;
  nomseg: string;
  datnas: string;
  observacoes: string;
  cpf: string;
  cod_profissao: string | null;
  nome_conjuge: string | null;
  sexo_conj: string | null;
  dt_nasc_conj: string | null;
  dt_excl_conj: string | null;
  dt_alt_conj: string | null;
  seguro_conjuge: string;
  num_sorteio: string | null;
  dt_prim_sorteio: string | null;
  perconj: number;
  garantias: Garantia[];
}

interface ItensResponse {
  header: {
    count: number;
  };
  itens: Item[];
}

export async function getItens(params: BuscarItensParams) {
  console.log('📡 [CorpNuvem Itens] Buscando itens/coberturas:', params);
  
  try {
    const res = await corpClient.get("/itens", { params });
    console.log('✅ [CorpNuvem Itens] Itens encontrados:', res.data);
    return res.data as ItensResponse;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Itens] Erro:', error?.response?.data);
    throw error;
  }
}

/**
 * Converte garantias da API CorpNuvem para o formato de coberturas do sistema
 */
export function convertGarantiasToCoberuras(garantias: Garantia[]) {
  return garantias.map(g => ({
    descricao: g.garantia,
    lmi: g.impseg
  }));
}
