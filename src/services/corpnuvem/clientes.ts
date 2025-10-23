import { corpClient } from "@/lib/corpClient";

interface BuscarClienteParams {
  texto?: string;
  codfil?: number;
  codigo?: number;
}

export async function getClientesCorpNuvem(params?: BuscarClienteParams) {
  console.log('📡 [CorpNuvem Clientes] Iniciando requisição com params:', params);
  
  // Se buscar por texto/nome, usar endpoint lista_clientes
  if (params?.texto) {
    try {
      const res = await corpClient.get("/lista_clientes", { 
        params: { texto: params.texto } 
      });
      console.log('✅ [CorpNuvem Clientes] Clientes encontrados:', res.data);
      return res.data?.clientes || [];
    } catch (error: any) {
      console.error('❌ [CorpNuvem Clientes] Erro:', error?.response?.data);
      throw error;
    }
  }
  
  // Se buscar por código específico, usar endpoint cliente
  if (params?.codfil && params?.codigo) {
    try {
      const res = await corpClient.get("/cliente", { 
        params: { 
          codfil: params.codfil,
          codigo: params.codigo 
        } 
      });
      console.log('✅ [CorpNuvem Clientes] Cliente detalhado encontrado:', res.data);
      return [res.data];
    } catch (error: any) {
      console.error('❌ [CorpNuvem Clientes] Erro:', error?.response?.data);
      throw error;
    }
  }
  
  throw new Error('Parâmetros inválidos. Forneça texto para busca ou codfil + codigo.');
}
