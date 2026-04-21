import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ExchangeAvatar } from './ExchangeAvatar';

const EXCHANGES = [
  { name: 'Bybit', avatarField: 'bybit_avatar_url', linkField: 'bybit_profile_link', color: 'bg-orange-500/20 text-orange-400', fallback: 'BB' },
  { name: 'Deriv', avatarField: 'deriv_avatar_url', linkField: 'deriv_profile_link', color: 'bg-red-500/20 text-red-400', fallback: 'DV' },
  { name: 'Binance', avatarField: 'binance_avatar_url', linkField: 'binance_profile_link', color: 'bg-yellow-500/20 text-yellow-400', fallback: 'BN' },
  { name: 'Redotpay', avatarField: 'redotpay_avatar_url', linkField: 'redotpay_profile_link', color: 'bg-blue-500/20 text-blue-400', fallback: 'RP' },
];

export function ExchangeAvatarsRow() {
  const { user } = useAuth();
  const { profile, refetch } = useUserProfile();
  if (!user?.id) return null;
  const profileData = profile as any;

  const handleUpload = async (field: string, url: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Exchange avatar update error:', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {EXCHANGES.map((ex) => (
        <ExchangeAvatar
          key={ex.name}
          name={ex.name}
          avatarUrl={profileData?.[ex.avatarField]}
          profileLink={profileData?.[ex.linkField]}
          userId={user.id}
          onUploadComplete={(url) => handleUpload(ex.avatarField, url)}
          fallbackColor={ex.color}
          fallbackText={ex.fallback}
        />
      ))}
    </div>
  );
}