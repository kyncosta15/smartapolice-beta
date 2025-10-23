import { corpClient } from "@/lib/corpClient";

interface BuscarDocumentoParams {
  codfil: number;
  nosnum: number;
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
