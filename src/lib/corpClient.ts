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
    return cachedToken;
  }

  try {
    // Faz login para obter novo token
    const response = await axios.post("https://api.corpnuvem.com/login", API_CREDENTIALS);
    
    if (response.data?.token) {
      cachedToken = response.data.token;
      // Define expiração para 1 hora (ajuste conforme necessário)
      tokenExpiry = Date.now() + (60 * 60 * 1000);
      return cachedToken;
    }
    
    throw new Error("Token não retornado pela API");
  } catch (error) {
    console.error("Erro ao fazer login na API CorpNuvem:", error);
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
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para renovar token em caso de 401
corpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se retornou 401 e ainda não tentou renovar o token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Limpa o cache de token
      cachedToken = null;
      tokenExpiry = null;
      
      try {
        // Obtém novo token
        const token = await getAuthToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Tenta novamente a requisição original
        return corpClient(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);
