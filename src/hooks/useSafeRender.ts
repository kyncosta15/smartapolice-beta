
import { useMemo } from 'react';
import { extractFieldValue } from '@/utils/extractFieldValue';

/**
 * Hook para garantir renderização segura de dados complexos
 */
export const useSafeRender = <T extends Record<string, any>>(data: T): Record<keyof T, string | number> => {
  return useMemo(() => {
    if (!data || typeof data !== 'object') {
      return {} as Record<keyof T, string | number>;
    }

    const safeData = {} as Record<keyof T, string | number>;
    
    Object.keys(data).forEach((key) => {
      const value = data[key];
      
      // Se é um valor primitivo, usar diretamente
      if (typeof value === 'string' || typeof value === 'number') {
        safeData[key as keyof T] = value;
      } else {
        // Usar extractFieldValue para converter objetos complexos
        safeData[key as keyof T] = extractFieldValue(value);
      }
    });
    
    return safeData;
  }, [data]);
};
