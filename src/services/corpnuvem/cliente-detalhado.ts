import { corpClient } from "@/lib/corpClient";

// Interfaces
export interface ClienteDetalhado {
  codigo: number;
  nome: string;
  cpf?: string;
  cnpj?: string;
  data_nascimento?: string;
  sexo?: string;
  estado_civil?: string;
  status?: string;
  orgao_expedidor?: string;
  indicado_por?: string;
  recebe_mala_direta?: boolean;
  avisa_vencimento?: boolean;
  observacoes?: string;
}

export interface Email {
  email: string;
  tipo?: string;
}

export interface Telefone {
  numero: string;
  tipo?: string;
}

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo?: string;
}

export interface Documento {
  nome: string;
  tipo?: string;
  url?: string;
  data?: string;
}

// Buscar emails do cliente
export async function getClienteEmails(codfil: number, codigo: number) {
  console.log('📧 [CorpNuvem Emails] Buscando emails:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_emails", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Emails] Emails encontrados:', res.data);
    return res.data?.emails || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Emails] Erro:', error?.response?.data);
    return [];
  }
}

// Buscar telefones do cliente
export async function getClienteTelefones(codfil: number, codigo: number) {
  console.log('📞 [CorpNuvem Telefones] Buscando telefones:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_telefones", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Telefones] Telefones encontrados:', res.data);
    return res.data?.telefones || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Telefones] Erro:', error?.response?.data);
    return [];
  }
}

// Buscar endereços do cliente
export async function getClienteEnderecos(codfil: number, codigo: number) {
  console.log('🏠 [CorpNuvem Endereços] Buscando endereços:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_enderecos", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Endereços] Endereços encontrados:', res.data);
    return res.data?.enderecos || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Endereços] Erro:', error?.response?.data);
    return [];
  }
}

// Buscar sinistros do cliente
export async function getClienteSinistros(codfil: number, codigo: number) {
  console.log('🚨 [CorpNuvem Sinistros] Buscando sinistros:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_sinistros", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Sinistros] Sinistros encontrados:', res.data);
    return res.data?.sinistros || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Sinistros] Erro:', error?.response?.data);
    return [];
  }
}

// Buscar renovações do cliente
export async function getClienteRenovacoes(codfil: number, codigo: number) {
  console.log('🔄 [CorpNuvem Renovações] Buscando renovações:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_renovacoes", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Renovações] Renovações encontradas:', res.data);
    return res.data?.renovacoes || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Renovações] Erro:', error?.response?.data);
    return [];
  }
}

// Buscar negócios em andamento do cliente
export async function getClienteNegocios(codfil: number, codigo: number) {
  console.log('💼 [CorpNuvem Negócios] Buscando negócios:', { codfil, codigo });
  
  try {
    const res = await corpClient.get("/cliente_negocios", { 
      params: { codfil, codigo } 
    });
    console.log('✅ [CorpNuvem Negócios] Negócios encontrados:', res.data);
    return res.data?.negocios || [];
  } catch (error: any) {
    console.error('❌ [CorpNuvem Negócios] Erro:', error?.response?.data);
    return [];
  }
}

// Função consolidada para buscar todos os dados do cliente
export async function getClienteCompleto(codfil: number, codigo: number) {
  console.log('🔍 [CorpNuvem Cliente Completo] Iniciando busca completa:', { codfil, codigo });
  
  try {
    // Buscar dados do cliente base
    const clienteRes = await corpClient.get("/cliente", { 
      params: { codfil, codigo } 
    });
    const cliente = clienteRes.data;

    // Buscar todas as informações em paralelo
    const [emails, telefones, enderecos, anexos, sinistros, renovacoes, negocios] = await Promise.all([
      getClienteEmails(codfil, codigo),
      getClienteTelefones(codfil, codigo),
      getClienteEnderecos(codfil, codigo),
      corpClient.get("/cliente_anexos", { params: { codfil, codigo } }).then(r => r.data?.anexos || []).catch(() => []),
      getClienteSinistros(codfil, codigo),
      getClienteRenovacoes(codfil, codigo),
      getClienteNegocios(codfil, codigo),
    ]);

    console.log('✅ [CorpNuvem Cliente Completo] Dados consolidados com sucesso');

    return {
      cliente,
      contatos: {
        emails,
        telefones,
      },
      enderecos,
      documentos: anexos,
      sinistros,
      renovacoes,
      negocios,
    };
  } catch (error: any) {
    console.error('❌ [CorpNuvem Cliente Completo] Erro:', error?.response?.data);
    throw error;
  }
}
