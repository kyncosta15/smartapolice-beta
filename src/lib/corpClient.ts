import axios from "axios";

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// Credenciais da API
const API_CREDENTIALS = {
  email: "rcaldas@api.com.br",
  senha: "api@2024",
  aplicacao: 0
};

async function getAuthToken(): Promise<string> {
  // Se tem token válido em cache, usa ele
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('🔑 [CorpNuvem Auth] Usando token em cache');
    return cachedToken;
  }

  try {
    console.log('🔑 [CorpNuvem Auth] Fazendo login...');
    
    // Faz login para obter novo token
    const response = await axios.post("https://api.corpnuvem.com/login", API_CREDENTIALS);
    
    console.log('🔑 [CorpNuvem Auth] Resposta do login:', {
      hasToken: !!response.data?.token,
      data: response.data
    });
    
    if (response.data?.token) {
      cachedToken = response.data.token;
      // Define expiração para 1 hora (ajuste conforme necessário)
      tokenExpiry = Date.now() + (60 * 60 * 1000);
      console.log('✅ [CorpNuvem Auth] Token obtido com sucesso');
      return cachedToken;
    }
    
    throw new Error("Token não retornado pela API");
  } catch (error: any) {
    console.error("❌ [CorpNuvem Auth] Erro ao fazer login:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error;
  }
}

export const corpClient = axios.create({
  baseURL: "https://api.corpnuvem.com",
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor para adicionar o token em todas as requisições
corpClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    // A API CorpNuvem usa o token diretamente, SEM "Bearer "
    config.headers.Authorization = token;
    
    console.log('🔧 [CorpNuvem Request] Configuração da requisição:', {
      url: config.url,
      baseURL: config.baseURL,
      method: config.method,
      headers: {
        Authorization: config.headers.Authorization?.substring(0, 50) + '...',
        'Content-Type': config.headers['Content-Type']
      },
      params: config.params
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para renovar token em caso de 401
corpClient.interceptors.response.use(
  (response) => {
    console.log('✅ [CorpNuvem Response] Resposta recebida com sucesso:', {
      status: response.status,
      url: response.config.url,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  async (error) => {
    console.error('❌ [CorpNuvem Response] Erro na resposta:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    const originalRequest = error.config;
    
    // Se retornou 401 e ainda não tentou renovar o token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 [CorpNuvem Auth] Tentando renovar token após 401...');
      originalRequest._retry = true;
      
      // Limpa o cache de token
      cachedToken = null;
      tokenExpiry = null;
      
      try {
        // Obtém novo token
        const token = await getAuthToken();
        // A API CorpNuvem usa o token diretamente, SEM "Bearer "
        originalRequest.headers.Authorization = token;
        
        console.log('🔄 [CorpNuvem Auth] Token renovado, tentando requisição novamente...');
        
        // Tenta novamente a requisição original
        return corpClient(originalRequest);
      } catch (err) {
        console.error('❌ [CorpNuvem Auth] Falha ao renovar token:', err);
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);
