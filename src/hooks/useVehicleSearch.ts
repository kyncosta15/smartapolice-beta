import { useState, useEffect, useCallback, useRef } from 'react';
import { VehiclesService } from '@/services/vehicles';
import { Vehicle } from '@/types/claims';

interface UseVehicleSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
  enabled?: boolean;
  empresaId?: string;
}

export function useVehicleSearch(options: UseVehicleSearchOptions = {}) {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    enabled = true,
    empresaId,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchVehicles = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const vehicles = await VehiclesService.searchVehicles(searchQuery, empresaId);
      
      if (!signal?.aborted) {
        setResults(vehicles);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar veículos');
        setResults([]);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [minQueryLength, empresaId]);

  const debouncedSearch = useCallback((searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Cancel previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear results immediately if query is too short
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately for better UX
    setIsLoading(true);
    setError(null);

    // Start new timer
    debounceTimerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      searchVehicles(searchQuery, controller.signal);
    }, debounceMs);
  }, [searchVehicles, debounceMs, minQueryLength]);

  useEffect(() => {
    if (enabled) {
      debouncedSearch(query);
    }
  }, [query, enabled, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    searchVehicles: debouncedSearch,
  };
}