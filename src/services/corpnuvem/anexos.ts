import { corpClient } from "@/lib/corpClient";

interface BuscarAnexosParams {
  codfil: number;
  codigo: number;
}

interface BuscarDocumentoAnexosParams {
  codfil: number;
  nosnum: number;
}

interface DocumentoAnexo {
  nome: string;
  tipo: string;
  descricao: string;
  datahora: string;
  usuinc: string;
  url: string;
  indice_anexo: number;
}

interface DocumentoAnexosResponse {
  anexos: DocumentoAnexo[];
}

export async function getClienteAnexos(params: BuscarAnexosParams) {
  console.log('📎 [CorpNuvem Anexos] Buscando anexos do cliente:', params);
  
  try {
    const res = await corpClient.get("/cliente_anexos", { 
      params: { 
        codfil: params.codfil,
        codigo: params.codigo 
      } 
    });
    console.log('✅ [CorpNuvem Anexos] Anexos encontrados:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro:', error?.response?.data);
    throw error;
  }
}

export async function getDocumentoAnexos(params: BuscarDocumentoAnexosParams): Promise<DocumentoAnexosResponse> {
  console.log('📎 [CorpNuvem Anexos] Buscando anexos do documento:', params);
  
  try {
    const res = await corpClient.get("/documento_anexos", { 
      params: { 
        codfil: params.codfil,
        nosnum: params.nosnum 
      } 
    });
    console.log('✅ [CorpNuvem Anexos] Anexos do documento encontrados:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro ao buscar anexos do documento:', error?.response?.data);
    throw error;
  }
}

export async function downloadDocumentoAnexo(url: string, fileName: string) {
  console.log('📥 [CorpNuvem Anexos] Baixando anexo de:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao baixar arquivo');
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
    
    console.log('✅ [CorpNuvem Anexos] Download realizado com sucesso');
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro ao baixar anexo:', error);
    throw error;
  }
}
