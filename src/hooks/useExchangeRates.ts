import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*');

      if (error) throw error;
      setRates(data || []);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const getRate = useCallback((from: string, to: string): number | null => {
    const rate = rates.find(r => r.from_currency === from && r.to_currency === to);
    return rate?.rate || null;
  }, [rates]);

  const convert = useCallback((amount: number, from: string, to: string): number | null => {
    const rate = getRate(from, to);
    if (rate === null) return null;
    return amount * rate;
  }, [getRate]);

  // Taxas pré-definidas
  const AOA_TO_IMCH = getRate('AOA', 'IMCH') || 0.001;
  const IMCH_TO_AOA = getRate('IMCH', 'AOA') || 1000;
  const IMCH_TO_USD = getRate('IMCH', 'USD') || 1;
  const USD_TO_IMCH = getRate('USD', 'IMCH') || 1;
  const IMCH_TO_ETH = getRate('IMCH', 'ETH') || 0.000003;
  const ETH_TO_IMCH = getRate('ETH', 'IMCH') || 333333;

  return {
    rates,
    loading,
    getRate,
    convert,
    refetch: fetchRates,
    AOA_TO_IMCH,
    IMCH_TO_AOA,
    IMCH_TO_USD,
    USD_TO_IMCH,
    IMCH_TO_ETH,
    ETH_TO_IMCH,
  };
};
