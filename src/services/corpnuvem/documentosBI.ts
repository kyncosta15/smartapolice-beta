import { corpClient } from "@/lib/corpClient";

export type TipoData = 'inivig' | 'datinc' | 'datalt' | 'datpro';
export type TipoDocumento = 'a' | 'n' | 'r' | 'f' | 'e'; // a=todos, n=novos, r=renovações, f=faturas, e=endossos

interface DocumentoBIParams {
  dt_ini: string; // formato DD/MM/YYYY
  dt_fim: string; // formato DD/MM/YYYY
  data: TipoData;
  tipo_doc: TipoDocumento;
  qtd_pag?: number; // quantidade por página
  pag?: number; // número da página
}

export interface DocumentoBI {
  codfil: number;
  nosnum: number;
  codcli: number;
  cliente: string;
  seguradora: string;
  ramo: string;
  inivig: string;
  fimvig: string;
  numpar: number;
  preliq: number;
  pretot: number;
  base_c: number;
  val_c: number;
  val_cp: number;
  numapo: string;
  numend: string;
  nosnum_ren: number | null;
  datpro: string;
  datalt: string;
  sit_sinistro: number;
}

export interface DocumentosBIResponse {
  header: {
    count: number;
  };
  documentos: DocumentoBI[];
}

export async function getDocumentosBI(params: DocumentoBIParams): Promise<DocumentosBIResponse> {
  console.log('📡 [CorpNuvem BI] Buscando documentos BI:', params);
  
  try {
    const res = await corpClient.get("/documentos_bi", { params });
    console.log('✅ [CorpNuvem BI] Documentos encontrados. Total:', res.data?.header?.count);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem BI] Erro:', error?.response?.data);
    throw error;
  }
}
