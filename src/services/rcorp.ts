// Serviços de integração com a API RCORP

const RCORP_API_BASE = 'https://api.rcorp.com.br'; // TODO: Configurar URL correta

interface NegociosEmCalculoParams {
  dtini?: string;
  dtfim?: string;
  texto?: string;
  qtd_pag?: number;
  pag?: number;
  status?: string;
}

interface ClientesParams {
  nome?: string;
}

interface ClienteDetailsParams {
  cliente_id: number;
}

export async function getNegociosEmCalculo(params: NegociosEmCalculoParams) {
  try {
    const queryParams = new URLSearchParams();
    if (params.dtini) queryParams.append('dtini', params.dtini);
    if (params.dtfim) queryParams.append('dtfim', params.dtfim);
    if (params.texto) queryParams.append('texto', params.texto);
    if (params.qtd_pag) queryParams.append('qtd_pag', params.qtd_pag.toString());
    if (params.pag) queryParams.append('pag', params.pag.toString());
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${RCORP_API_BASE}/em_calculo?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar negócios em cálculo:', error);
    throw error;
  }
}

export async function getClientes(params: ClientesParams) {
  try {
    const queryParams = new URLSearchParams();
    if (params.nome) queryParams.append('nome', params.nome);

    const response = await fetch(`${RCORP_API_BASE}/clientes?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
}

export async function getEnderecosPorCliente(params: ClienteDetailsParams) {
  try {
    const response = await fetch(`${RCORP_API_BASE}/clientes/${params.cliente_id}/enderecos`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar endereços do cliente:', error);
    throw error;
  }
}

export async function getEmailsPorCliente(params: ClienteDetailsParams) {
  try {
    const response = await fetch(`${RCORP_API_BASE}/clientes/${params.cliente_id}/emails`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar emails do cliente:', error);
    throw error;
  }
}

export async function getTelefonesPorCliente(params: ClienteDetailsParams) {
  try {
    const response = await fetch(`${RCORP_API_BASE}/clientes/${params.cliente_id}/telefones`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar telefones do cliente:', error);
    throw error;
  }
}

interface ProdutoresParams {
  nome?: string;
  codigo?: string;
}

export async function getProdutores(params: ProdutoresParams) {
  try {
    const queryParams = new URLSearchParams();
    if (params.nome) queryParams.append('nome', params.nome);
    if (params.codigo) queryParams.append('codigo', params.codigo);

    const response = await fetch(`${RCORP_API_BASE}/produtor?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produtores:', error);
    throw error;
  }
}

export async function getRamos() {
  try {
    const response = await fetch(`${RCORP_API_BASE}/ramo`);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar ramos:', error);
    throw error;
  }
}
