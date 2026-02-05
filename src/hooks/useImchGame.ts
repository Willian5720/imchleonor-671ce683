import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TransferRecord {
  id: string;
  amount_usdt: number;
  coins_transferred: number;
  status: string;
  bybit_transfer_id: string | null;
  error_message: string | null;
  created_at: string;
}

export const useImchGame = () => {
  const { user } = useAuth();
  const userEmail = user?.email || '';
  
  const [coins, setCoins] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(500);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'waiting' | 'processing' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get balance first - this checks authorization
      const balanceRes = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'get_balance', userEmail },
      });
      
      // Check for unauthorized response (403 or unauthorized flag)
      if (balanceRes.error || balanceRes.data?.unauthorized) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      
      // User is authorized, proceed with other requests
      setIsAuthorized(true);
      
      if (balanceRes.data?.success) {
        setCoins(Number(balanceRes.data.coins) || 0);
      }
      
      // Get settings and transfers in parallel (only if authorized)
      const [settingsRes, transfersRes] = await Promise.all([
        supabase.functions.invoke('bybit-transfer', {
          body: { action: 'get_settings', userEmail },
        }),
        supabase.functions.invoke('bybit-transfer', {
          body: { action: 'get_transfers', userEmail },
        }),
      ]);
      
      if (settingsRes.data?.success) {
        setThreshold(Number(settingsRes.data.threshold) || 500);
      }
      
      if (transfersRes.data?.success) {
        setTransfers(transfersRes.data.transfers || []);
      }
      
      // Update status message
      const currentCoins = Number(balanceRes.data?.coins) || 0;
      const currentThreshold = Number(settingsRes.data?.threshold) || 500;
      
      if (currentCoins >= currentThreshold) {
        setTransferStatus('processing');
        setStatusMessage('Transferência em processamento...');
      } else if (currentCoins > 0) {
        setTransferStatus('waiting');
        setStatusMessage(`Aguardando saldo mínimo de ${currentThreshold} USDT`);
      } else {
        setTransferStatus('idle');
        setStatusMessage('Comece a minerar IMCH Coins!');
      }
      
    } catch {
      // If any error occurs, assume unauthorized for safety
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add coin (mine)
  const addCoin = useCallback(async (amount: number = 1) => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'add_coins', coins: amount, userEmail },
      });
      
      if (result.data?.success) {
        const newBalance = Number(result.data.coins);
        setCoins(newBalance);
        
        // Check if we should trigger automatic transfer
        if (newBalance >= threshold) {
          await checkAndTransfer();
        } else {
          setTransferStatus('waiting');
          setStatusMessage(`Aguardando saldo mínimo de ${threshold} USDT`);
        }
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [threshold, userEmail]);

  // Check and execute automatic transfer
  const checkAndTransfer = useCallback(async () => {
    try {
      setTransferStatus('processing');
      setStatusMessage('Transferência em processamento...');
      
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'check_and_transfer', userEmail },
      });
      
      if (result.data?.success) {
        setCoins(Number(result.data.coins) || 0);
        
        if (result.data.status === 'completed') {
          setTransferStatus('completed');
          setStatusMessage('Transferência concluída!');
          // Refresh transfers list
          const transfersRes = await supabase.functions.invoke('bybit-transfer', {
            body: { action: 'get_transfers', userEmail },
          });
          if (transfersRes.data?.success) {
            setTransfers(transfersRes.data.transfers || []);
          }
          // Reset status after a few seconds
          setTimeout(() => {
            setTransferStatus('idle');
            setStatusMessage('Comece a minerar IMCH Coins!');
          }, 5000);
        } else if (result.data.status === 'waiting') {
          setTransferStatus('waiting');
          setStatusMessage(result.data.message);
        } else {
          setTransferStatus('failed');
          setStatusMessage(result.data.message || 'Falha na transferência');
        }
      } else {
        setTransferStatus('failed');
        setStatusMessage(result.data?.error || 'Erro ao processar transferência');
      }
    } catch {
      setTransferStatus('failed');
      setStatusMessage('Erro de conexão');
    }
  }, [userEmail]);

  // Update threshold setting
  const updateThreshold = useCallback(async (newThreshold: number) => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'update_settings', threshold: newThreshold, userEmail },
      });
      
      if (result.data?.success) {
        setThreshold(newThreshold);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [userEmail]);

  // Calculate USDT value (1 IMCH = 100 USDT)
  const getUsdtValue = useCallback(() => {
    return coins * 100;
  }, [coins]);

  // Manual transfer (ignores threshold)
  const manualTransfer = useCallback(async (customCoins?: number) => {
    const coinsToTransfer = customCoins ?? coins;
    
    if (coinsToTransfer <= 0) {
      setStatusMessage('Saldo insuficiente para transferência');
      return false;
    }
    
    if (customCoins && customCoins > coins) {
      setStatusMessage('Valor excede o saldo disponível');
      return false;
    }
    
    try {
      setTransferStatus('processing');
      setStatusMessage('Transferência manual em processamento...');
      
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'manual_transfer', userEmail, coins: coinsToTransfer },
      });
      
      if (result.data?.success && result.data.status === 'completed') {
        setCoins(Number(result.data.coins) || 0);
        setTransferStatus('completed');
        setStatusMessage('Transferência manual concluída!');
        
        // Refresh transfers list
        const transfersRes = await supabase.functions.invoke('bybit-transfer', {
          body: { action: 'get_transfers', userEmail },
        });
        if (transfersRes.data?.success) {
          setTransfers(transfersRes.data.transfers || []);
        }
        
        setTimeout(() => {
          setTransferStatus('idle');
          setStatusMessage('Comece a minerar IMCH Coins!');
        }, 5000);
        
        return true;
      } else {
        setTransferStatus('failed');
        setStatusMessage(result.data?.message || result.data?.error || 'Falha na transferência');
        return false;
      }
    } catch {
      setTransferStatus('failed');
      setStatusMessage('Erro de conexão');
      return false;
    }
  }, [coins, userEmail]);

  // Reset coins to zero
  const resetCoins = useCallback(async () => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'reset_coins', userEmail },
      });
      
      if (result.data?.success) {
        setCoins(0);
        setTransferStatus('idle');
        setStatusMessage('Saldo resetado! Comece a minerar novamente.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [userEmail]);

  // Withdraw to external wallet
  const withdrawToWallet = useCallback(async (coinsToWithdraw: number, walletAddress: string) => {
    if (coinsToWithdraw <= 0 || coinsToWithdraw > coins) {
      setStatusMessage('Saldo insuficiente para saque');
      return false;
    }
    
    try {
      setTransferStatus('processing');
      setStatusMessage('Processando saque para carteira externa...');
      
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { 
          action: 'withdraw_to_wallet', 
          userEmail, 
          coins: coinsToWithdraw,
          walletAddress 
        },
      });
      
      if (result.data?.success && result.data.status === 'completed') {
        setCoins(Number(result.data.coins) || 0);
        setTransferStatus('completed');
        setStatusMessage('Saque iniciado! Aguarde confirmação na blockchain.');
        
        // Refresh transfers list
        const transfersRes = await supabase.functions.invoke('bybit-transfer', {
          body: { action: 'get_transfers', userEmail },
        });
        if (transfersRes.data?.success) {
          setTransfers(transfersRes.data.transfers || []);
        }
        
        setTimeout(() => {
          setTransferStatus('idle');
          setStatusMessage('Comece a minerar IMCH Coins!');
        }, 10000);
        
        return true;
      } else {
        setTransferStatus('failed');
        setStatusMessage(result.data?.message || result.data?.error || 'Falha no saque');
        return false;
      }
    } catch {
      setTransferStatus('failed');
      setStatusMessage('Erro de conexão');
      return false;
    }
  }, [coins, userEmail]);

  // Get Bybit balance
  const getBybitBalance = useCallback(async () => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'get_bybit_balance', userEmail },
      });
      
      if (result.data?.success) {
        return {
          unified: result.data.unified || 0,
          funding: result.data.funding || 0,
          total: result.data.total || 0,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [userEmail]);

  return {
    coins,
    threshold,
    transfers,
    isLoading,
    isAuthorized,
    transferStatus,
    statusMessage,
    addCoin,
    updateThreshold,
    getUsdtValue,
    checkAndTransfer,
    manualTransfer,
    resetCoins,
    refreshData: fetchData,
    withdrawToWallet,
    getBybitBalance,
  };
};
