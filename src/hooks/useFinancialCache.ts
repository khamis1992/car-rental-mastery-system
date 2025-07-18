
import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
}

export const useFinancialCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options; // Default 5 minutes TTL
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // In-memory cache (in a real app, you might use localStorage or IndexedDB)
  const cache = new Map<string, CacheEntry<any>>();

  const getCachedData = useCallback((cacheKey: string): T | null => {
    const entry = cache.get(cacheKey);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }, []);

  const setCacheData = useCallback((cacheKey: string, value: T) => {
    // Clean old entries if cache is too large
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }, [maxSize, ttl]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCachedData(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setCacheData(key, result);
      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل البيانات';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, getCachedData, setCacheData]);

  const invalidateCache = useCallback(() => {
    cache.delete(key);
    setData(null);
    setLastFetch(0);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate: invalidateCache,
    lastFetch: new Date(lastFetch),
    isCached: !!getCachedData(key)
  };
};
