import { corpClient } from "@/lib/corpClient";

interface BuscarProducaoParams {
  texto?: string;
  dt_ini: string; // formato: DD/MM/YYYY
  dt_fim: string; // formato: DD/MM/YYYY
  ordem?: string;
  orientacao?: 'asc' | 'desc';
  so_renovados?: 't' | 'f' | 'x'; // t=true, f=false, x=todos
  so_emitidos?: 't' | 'f' | 'x';
}

export async function getProducao(params: BuscarProducaoParams) {
  console.log('📡 [CorpNuvem Produção] Buscando produção:', params);
  
  const queryParams = {
    texto: params.texto || '',
    dt_ini: params.dt_ini,
    dt_fim: params.dt_fim,
    ordem: params.ordem || 'inivig',
    orientacao: params.orientacao || 'asc',
    so_renovados: params.so_renovados || 'x',
    so_emitidos: params.so_emitidos || 'x'
  };
  
  try {
    const res = await corpClient.get("/producao", { params: queryParams });
    console.log('✅ [CorpNuvem Produção] Dados encontrados');
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Produção] Erro:', error?.response?.data);
    throw error;
  }
}
