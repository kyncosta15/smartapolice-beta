import { useToast } from '@/hooks/use-toast';

interface FipeResult {
  valor: number;
  fonte: string;
  atualizadoEm: string;
}

interface FipeParams {
  placa?: string;
  marca?: string;
  modelo?: string;
  ano_modelo?: number;
}

// Simple in-memory cache for 12 hours
const fipeCache = new Map<string, { data: FipeResult; expiry: number }>();
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

class FipeService {
  private generateCacheKey(params: FipeParams): string {
    if (params.placa) {
      return `placa:${params.placa}`;
    }
    return `marca:${params.marca}|modelo:${params.modelo}|ano:${params.ano_modelo}`;
  }

  private getCachedResult(key: string): FipeResult | null {
    const cached = fipeCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      fipeCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResult(key: string, data: FipeResult): void {
    fipeCache.set(key, {
      data,
      expiry: Date.now() + CACHE_DURATION
    });
  }

  async getPrice(params: FipeParams): Promise<FipeResult> {
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Try by plate first if available
      if (params.placa) {
        const result = await this.fetchByPlate(params.placa);
        if (result) {
          this.setCachedResult(cacheKey, result);
          return result;
        }
      }

      // Fallback to brand/model/year
      if (params.marca && params.modelo) {
        const result = await this.fetchByBrandModel(params.marca, params.modelo, params.ano_modelo);
        if (result) {
          this.setCachedResult(cacheKey, result);
          return result;
        }
      }

      throw new Error('Não foi possível obter o valor FIPE para este veículo');
    } catch (error) {
      console.error('Erro ao buscar FIPE:', error);
      throw error;
    }
  }

  private async fetchByPlate(placa: string): Promise<FipeResult | null> {
    try {
      // Mock implementation - replace with actual API call
      // This would call a real FIPE API service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Simulate some variation in prices based on plate
      const mockPrice = 45000 + (placa.charCodeAt(0) * 1000);
      
      return {
        valor: mockPrice,
        fonte: 'FIPE - Consulta por Placa',
        atualizadoEm: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na consulta FIPE por placa:', error);
      return null;
    }
  }

  private async fetchByBrandModel(marca: string, modelo: string, ano?: number): Promise<FipeResult | null> {
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      
      // Simulate price based on brand and model
      let basePrice = 30000;
      
      if (marca.toLowerCase().includes('honda')) basePrice = 35000;
      if (marca.toLowerCase().includes('toyota')) basePrice = 45000;
      if (marca.toLowerCase().includes('bmw')) basePrice = 80000;
      if (marca.toLowerCase().includes('mercedes')) basePrice = 90000;
      
      if (modelo.toLowerCase().includes('civic')) basePrice += 20000;
      if (modelo.toLowerCase().includes('corolla')) basePrice += 15000;
      if (modelo.toLowerCase().includes('caminhao')) basePrice += 50000;
      
      if (ano) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - ano;
        basePrice *= Math.max(0.3, 1 - (age * 0.05)); // Depreciation
      }
      
      return {
        valor: Math.round(basePrice),
        fonte: 'FIPE - Consulta por Marca/Modelo',
        atualizadoEm: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na consulta FIPE por marca/modelo:', error);
      return null;
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    fipeCache.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: fipeCache.size,
      keys: Array.from(fipeCache.keys())
    };
  }
}

export const fipeService = new FipeService();

// Hook for using FIPE service with toast notifications
export function useFipeService() {
  const { toast } = useToast();

  const updateFipePrice = async (params: FipeParams) => {
    try {
      toast({
        title: "Consultando FIPE",
        description: "Buscando valor atualizado...",
      });

      const result = await fipeService.getPrice(params);
      
      toast({
        title: "Valor FIPE atualizado",
        description: `Valor: R$ ${result.valor.toLocaleString('pt-BR')}`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao consultar FIPE",
        description: error.message || "Não foi possível obter o valor FIPE",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { updateFipePrice };
}