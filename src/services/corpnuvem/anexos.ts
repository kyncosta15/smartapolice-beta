import { corpClient } from "@/lib/corpClient";

interface BuscarAnexosParams {
  codfil: number;
  codigo: number;
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
