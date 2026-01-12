import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  icon: string;
}

export function useCryptoPrices(refreshInterval = 30000) {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke('crypto-prices', {
        body: { action: 'get_all' },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setPrices(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data?.error || 'Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch crypto prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(fetchPrices, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refetch: fetchPrices,
  };
}

export function useSingleCryptoPrice(symbol: string) {
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const { data, error: fnError } = await supabase.functions.invoke('crypto-prices', {
        body: { action: 'get_single', symbol },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setPrice(data.data);
      } else {
        throw new Error(data?.error || 'Failed to fetch price');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return { price, loading, error, refetch: fetchPrice };
}
