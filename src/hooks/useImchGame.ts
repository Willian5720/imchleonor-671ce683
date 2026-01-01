import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [coins, setCoins] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(500);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'waiting' | 'processing' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get balance
      const balanceRes = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'get_balance' },
      });
      if (balanceRes.data?.success) {
        setCoins(Number(balanceRes.data.coins) || 0);
      }
      
      // Get settings
      const settingsRes = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'get_settings' },
      });
      if (settingsRes.data?.success) {
        setThreshold(Number(settingsRes.data.threshold) || 500);
      }
      
      // Get transfers
      const transfersRes = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'get_transfers' },
      });
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
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add coin (mine)
  const addCoin = useCallback(async (amount: number = 1) => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'add_coins', coins: amount },
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
    } catch (error) {
      console.error('Error adding coin:', error);
      return false;
    }
  }, [threshold]);

  // Check and execute automatic transfer
  const checkAndTransfer = useCallback(async () => {
    try {
      setTransferStatus('processing');
      setStatusMessage('Transferência em processamento...');
      
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'check_and_transfer' },
      });
      
      if (result.data?.success) {
        setCoins(Number(result.data.coins) || 0);
        
        if (result.data.status === 'completed') {
          setTransferStatus('completed');
          setStatusMessage('Transferência concluída!');
          // Refresh transfers list
          const transfersRes = await supabase.functions.invoke('bybit-transfer', {
            body: { action: 'get_transfers' },
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
    } catch (error) {
      console.error('Error checking transfer:', error);
      setTransferStatus('failed');
      setStatusMessage('Erro de conexão');
    }
  }, []);

  // Update threshold setting
  const updateThreshold = useCallback(async (newThreshold: number) => {
    try {
      const result = await supabase.functions.invoke('bybit-transfer', {
        body: { action: 'update_settings', threshold: newThreshold },
      });
      
      if (result.data?.success) {
        setThreshold(newThreshold);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating threshold:', error);
      return false;
    }
  }, []);

  // Calculate USDT value (1:1 conversion)
  const getUsdtValue = useCallback(() => {
    return coins;
  }, [coins]);

  return {
    coins,
    threshold,
    transfers,
    isLoading,
    transferStatus,
    statusMessage,
    addCoin,
    updateThreshold,
    getUsdtValue,
    checkAndTransfer,
    refreshData: fetchData,
  };
};
