import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KycVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  document_type: string | null;
  document_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  document_image_url: string | null;
  extracted_data: Record<string, unknown> | null;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useKycStatus() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKyc = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setKyc(data as KycVerification | null);
    } catch (err) {
      console.error('Error fetching KYC:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const isVerified = kyc?.status === 'approved';
  const isPending = kyc?.status === 'pending';
  const isRejected = kyc?.status === 'rejected';
  const hasSubmitted = !!kyc;

  return { kyc, loading, isVerified, isPending, isRejected, hasSubmitted, refetch: fetchKyc };
}
