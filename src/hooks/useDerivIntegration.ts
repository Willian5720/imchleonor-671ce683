import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useExchangeRates } from './useExchangeRates';

export interface DerivTransaction {
  id: string;
  user_id: string;
  deriv_account_id: string;
  blockchain_ledger_id: string | null;
  transaction_type: 'deposit' | 'withdrawal';
  amount_imch: number;
  amount_usd: number;
  exchange_rate: number;
  deriv_reference: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  blockchain_ledger?: BlockchainBlock;
}

export interface BlockchainBlock {
  id: string;
  block_number: number;
  previous_hash: string;
  current_hash: string;
  user_id: string | null;
  transaction_type: string;
  amount: number;
  currency: string;
  from_address: string | null;
  to_address: string | null;
  status: string;
  confirmations: number;
  created_at: string;
  confirmed_at: string | null;
}

export const useDerivIntegration = () => {
  const { user, session } = useAuth();
  const { IMCH_TO_USD, AOA_TO_IMCH, IMCH_TO_ETH } = useExchangeRates();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<DerivTransaction[]>([]);
  const [blockchainBlocks, setBlockchainBlocks] = useState<BlockchainBlock[]>([]);
  const [derivBalance, setDerivBalance] = useState<number>(0);

  const callDerivFunction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    if (!session?.access_token) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deriv-integration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...params }),
      }
    );

    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Erro na operação');
    }

    return data;
  }, [session?.access_token]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await callDerivFunction('history');
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user, callDerivFunction]);

  const fetchBlockchainHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await callDerivFunction('blockchain_history');
      setBlockchainBlocks(data.blocks || []);
    } catch (error) {
      console.error('Error fetching blockchain:', error);
    }
  }, [user, callDerivFunction]);

  const fetchDerivBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await callDerivFunction('get_accounts');
      setDerivBalance(data.balance || 0);
    } catch (error) {
      console.error('Error fetching Deriv balance:', error);
    }
  }, [user, callDerivFunction]);

  const deposit = useCallback(async (amountImch: number, toAddress?: string) => {
    setLoading(true);
    try {
      const result = await callDerivFunction('deposit', { 
        amount_imch: amountImch,
        to_address: toAddress 
      });
      toast.success(`Depósito de ${amountImch} IMCH realizado com sucesso!`);
      await fetchTransactions();
      await fetchBlockchainHistory();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro no depósito';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callDerivFunction, fetchTransactions, fetchBlockchainHistory]);

  const withdraw = useCallback(async (amountImch: number, toAddress?: string) => {
    setLoading(true);
    try {
      const result = await callDerivFunction('withdraw', { 
        amount_imch: amountImch,
        to_address: toAddress 
      });
      toast.success(`Retirada de ${amountImch} IMCH realizada com sucesso!`);
      await fetchTransactions();
      await fetchBlockchainHistory();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro na retirada';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callDerivFunction, fetchTransactions, fetchBlockchainHistory]);

  const addBalanceFromAOA = useCallback(async (amountAOA: number) => {
    setLoading(true);
    try {
      const result = await callDerivFunction('add_balance_aoa', { amount_aoa: amountAOA });
      toast.success(`${result.amount_imch.toFixed(2)} IMCH adicionados!`);
      await fetchBlockchainHistory();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro na conversão';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callDerivFunction, fetchBlockchainHistory]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchTransactions();
    fetchBlockchainHistory();
    fetchDerivBalance();

    const channel = supabase
      .channel('deriv-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deriv_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blockchain_ledger',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBlockchainHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions, fetchBlockchainHistory, fetchDerivBalance]);

  const convertImchToUsd = (imch: number) => imch * IMCH_TO_USD;
  const convertUsdToImch = (usd: number) => usd / IMCH_TO_USD;
  const convertAoaToImch = (aoa: number) => aoa * AOA_TO_IMCH;
  const convertImchToEth = (imch: number) => imch * IMCH_TO_ETH;

  return {
    loading,
    transactions,
    blockchainBlocks,
    derivBalance,
    deposit,
    withdraw,
    addBalanceFromAOA,
    fetchTransactions,
    fetchBlockchainHistory,
    convertImchToUsd,
    convertUsdToImch,
    convertAoaToImch,
    convertImchToEth,
    exchangeRate: IMCH_TO_USD,
  };
};
