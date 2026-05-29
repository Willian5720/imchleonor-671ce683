import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformMessage {
  id: string;
  title: string | null;
  content: string;
  type: string;
  created_at: string;
}

export function usePlatformMessages() {
  return useQuery({
    queryKey: ['platform-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching platform messages:', error);
        return [];
      }
      return data as PlatformMessage[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
