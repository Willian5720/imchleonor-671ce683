import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'profile_update'
  | 'transfer_sent'
  | 'transfer_received'
  | 'password_change'
  | 'settings_update';

export const useAuditLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (limit = 50) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logAction = useCallback(async (
    action: AuditAction,
    entityType?: string,
    entityId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return null;

    try {
      // Convert to JSON-compatible format for Supabase
      const jsonDetails = details ? JSON.parse(JSON.stringify(details)) : {};
      
      const { data, error } = await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: action,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: jsonDetails
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging action:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, fetchLogs]);

  return {
    logs,
    loading,
    fetchLogs,
    logAction
  };
};
