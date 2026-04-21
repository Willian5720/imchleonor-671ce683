import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
}

export interface UserTransfer {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  note: string | null;
  status: string;
  created_at: string;
  from_user?: { email: string | null; display_name: string | null };
  to_user?: { email: string | null; display_name: string | null };
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // Wait for auth to finish restoring session before deciding
    if (authLoading) return;

    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setProfile(data as UserProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          avatar_url: updates.avatar_url,
          bio: updates.bio,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log profile update
      const jsonDetails = JSON.parse(JSON.stringify({ 
        fields_updated: Object.keys(updates).filter(k => updates[k as keyof UserProfile] !== undefined) 
      }));
      await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: 'profile_update',
        p_entity_type: 'profile',
        p_entity_id: user.id,
        p_details: jsonDetails
      });

      await fetchProfile();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  };

  return {
    profile,
    loading: authLoading || loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

export function useUserTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<UserTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_transfers')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setTransfers((data || []) as UserTransfer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const sendTransfer = async (toEmail: string, amount: number, note?: string) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      // Use secure edge function to find recipient by exact email match
      const { data: searchResult, error: searchError } = await supabase.functions.invoke('search-users', {
        body: { email: toEmail.toLowerCase().trim(), exact_match: true },
      });

      if (searchError) throw searchError;
      
      if (!searchResult?.found) {
        return { success: false, error: searchResult?.error || 'Este email não está cadastrado na plataforma. A transferência só pode ser feita para usuários registrados.' };
      }

      const recipient = searchResult.user;
      if (!recipient) return { success: false, error: 'Destinatário não encontrado' };
      if (recipient.id === user.id) return { success: false, error: 'Não é possível transferir para você mesmo' };

      // Call the transfer function
      const { data, error: transferError } = await supabase.rpc('transfer_between_users', {
        p_from_user_id: user.id,
        p_to_user_id: recipient.id,
        p_amount: amount,
        p_currency: 'COINS',
        p_note: note || null,
      });

      if (transferError) throw transferError;

      const result = data as { success: boolean; error?: string; transfer_id?: string; new_balance?: number };
      
      if (!result.success) {
        return { success: false, error: result.error || 'Transfer failed' };
      }

      // Log the transfer
      const jsonDetails = JSON.parse(JSON.stringify({ 
        to_email: toEmail, 
        amount, 
        currency: 'COINS',
        note: note || null 
      }));
      await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: 'transfer_sent',
        p_entity_type: 'transfer',
        p_entity_id: result.transfer_id || null,
        p_details: jsonDetails
      });

      await fetchTransfers();
      return { success: true, transfer_id: result.transfer_id, new_balance: result.new_balance };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send transfer' };
    }
  };

  return {
    transfers,
    loading,
    error,
    sendTransfer,
    refetch: fetchTransfers,
  };
}

export interface SearchUserResult {
  id: string;
  email: string | null;
  email_hint: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useSearchUsers() {
  const [searching, setSearching] = useState(false);

  const searchByEmail = async (email: string): Promise<SearchUserResult[]> => {
    if (!email || email.length < 3) return [];

    try {
      setSearching(true);
      
      // Use secure edge function that masks email addresses
      const { data, error } = await supabase.functions.invoke('search-users', {
        body: { email },
      });

      if (error) throw error;
      return data?.users || [];
    } catch {
      return [];
    } finally {
      setSearching(false);
    }
  };

  return { searchByEmail, searching };
}
