import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserWallet {
  id: string;
  user_id: string;
  wallet_type: string;
  address: string;
  is_primary: boolean;
  label: string | null;
  created_at: string;
}

export const useUserWallets = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const generateAddress = useCallback(async (walletType: string = 'imch', label?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Gerar endereço usando a função do banco
      const { data: addressData, error: addressError } = await supabase
        .rpc('generate_wallet_address', { p_prefix: walletType === 'ethereum' ? 'eth' : 'imch' });

      if (addressError) throw addressError;

      // Inserir na tabela de wallets
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          wallet_type: walletType,
          address: addressData,
          label: label || `${walletType.toUpperCase()} Wallet`,
          is_primary: wallets.filter(w => w.wallet_type === walletType).length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      setWallets(prev => [data, ...prev]);
      toast.success('Endereço gerado com sucesso!');
      return data.address;
    } catch (error) {
      console.error('Error generating address:', error);
      toast.error('Erro ao gerar endereço');
      return null;
    }
  }, [user, wallets]);

  const getPrimaryWallet = useCallback((walletType: string): UserWallet | null => {
    return wallets.find(w => w.wallet_type === walletType && w.is_primary) || 
           wallets.find(w => w.wallet_type === walletType) || 
           null;
  }, [wallets]);

  const getImchAddress = useCallback(() => {
    return getPrimaryWallet('imch')?.address || null;
  }, [getPrimaryWallet]);

  const getEthAddress = useCallback(() => {
    return getPrimaryWallet('ethereum')?.address || null;
  }, [getPrimaryWallet]);

  return {
    wallets,
    loading,
    generateAddress,
    getPrimaryWallet,
    getImchAddress,
    getEthAddress,
    refetch: fetchWallets,
  };
};
