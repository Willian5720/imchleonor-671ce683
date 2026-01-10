import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to check user admin role for UI rendering decisions ONLY.
 * 
 * SECURITY NOTE: This hook queries the user_roles table for client-side UI purposes.
 * It should NEVER be used as the sole security boundary for protected operations.
 * All sensitive operations must be validated server-side (e.g., in edge functions
 * using JWT verification against the ADMIN_EMAIL environment variable).
 * 
 * The backend edge function (bybit-transfer) properly validates admin access
 * server-side. This client-side check is only for UX to show/hide admin UI elements.
 */
export const useUserRole = () => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, isAuthenticated]);

  return { isAdmin, loading };
};
