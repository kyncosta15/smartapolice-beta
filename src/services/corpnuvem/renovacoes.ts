import { corpClient } from "@/lib/corpClient";

interface BuscarRenovacoesParams {
  dt_ini: string; // formato: DD/MM/YYYY
  dt_fim: string; // formato: DD/MM/YYYY
  qtd_pag?: number;
  pag?: number;
  ordem?: string;
  orientacao?: 'asc' | 'desc';
  texto?: string;
  cancelado?: 't' | 'f';
  resgates?: 't' | 'f';
  codcli?: string;
  codram?: string;
  codcia?: string;
}

export async function getRenovacoes(params: BuscarRenovacoesParams) {
  console.log('📡 [CorpNuvem Renovações] Buscando renovações:', params);
  
  const queryParams = {
    dt_ini: params.dt_ini,
    dt_fim: params.dt_fim,
    qtd_pag: params.qtd_pag || 20,
    pag: params.pag || 1,
    ordem: params.ordem || 'nosnum',
    orientacao: params.orientacao || 'asc',
    texto: params.texto || '',
    cancelado: params.cancelado || 'F',
    resgates: params.resgates || 'F',
    codcli: params.codcli || '',
    codram: params.codram || '',
    codcia: params.codcia || ''
  };
  
  try {
    const res = await corpClient.get("/renovacoes", { params: queryParams });
    console.log('✅ [CorpNuvem Renovações] Dados encontrados:', res.data?.header?.count || 0, 'renovações');
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Renovações] Erro:', error?.response?.data);
    throw error;
  }
}
