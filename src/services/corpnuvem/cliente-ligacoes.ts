import { corpClient } from "@/lib/corpClient";

export interface ClienteLigacao {
  codfil: number;
  nosnum: number;
  tipdoc: string;
  seguradora: string;
  ramo: string;
  cliente_codigo: number;
  cliente: string;
  inivig: string;
  fimvig: string;
  numapo: string | null;
  numend: string | null;
  sin_situacao: number;
  cancelado: string;
  historico_imagem: number;
  renovacao_situacao: number;
  dat_inc: string;
  nosnum_ren: number | null;
}

export interface ClienteLigacoesResponse {
  documentos?: {
    header: {
      count: number;
    };
    documentos: ClienteLigacao[];
  };
  negocios?: {
    message?: string;
  };
  cotacoes?: {
    message?: string;
  };
}

export async function getClienteLigacoes(clienteCodigo: number): Promise<ClienteLigacoesResponse> {
  try {
    console.log(`🔄 Buscando ligações do cliente ${clienteCodigo}...`);
    
    const response = await corpClient.get('/cliente_ligacoes', {
      params: { codigo: clienteCodigo }
    });
    
    console.log(`✅ Ligações do cliente ${clienteCodigo}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erro ao buscar ligações do cliente ${clienteCodigo}:`, error);
    throw error;
  }
}
