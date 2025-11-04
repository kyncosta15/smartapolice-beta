import { corpClient } from "@/lib/corpClient";

interface BuscarDocumentoParams {
  codfil: number;
  nosnum: number;
}

interface BuscarDocumentosParams {
  qtd_pag: number;
  pag: number;
  periodo: string;
  codfil: number;
  ano?: number;
}

export async function getDocumento(params: BuscarDocumentoParams) {
  console.log('📡 [CorpNuvem Documentos] Buscando documento:', params);
  
  try {
    const res = await corpClient.get("/documento", { params });
    console.log('✅ [CorpNuvem Documentos] Documento encontrado');
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Documentos] Erro:', error?.response?.data);
    throw error;
  }
}

export async function getDocumentos(params: BuscarDocumentosParams) {
  console.log('📡 [CorpNuvem Documentos] Buscando lista de documentos:', params);
  
  try {
    const res = await corpClient.get("/documentos", { params });
    console.log('✅ [CorpNuvem Documentos] Lista encontrada. Total:', res.data?.header?.count);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Documentos] Erro:', error?.response?.data);
    throw error;
  }
}
