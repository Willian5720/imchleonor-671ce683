import { useState } from 'react';
import { User, Mail, Phone, FileText, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AvatarUpload } from './AvatarUpload';
import { ExchangeAvatar } from './ExchangeAvatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function UserProfileCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, loading, updateProfile, refetch } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_url: '',
    bio: '',
    phone: '',
    bybit_profile_link: '',
    deriv_profile_link: '',
    binance_profile_link: '',
    redotpay_profile_link: '',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        bybit_profile_link: (profile as any).bybit_profile_link || '',
        deriv_profile_link: (profile as any).deriv_profile_link || '',
        binance_profile_link: (profile as any).binance_profile_link || '',
        redotpay_profile_link: (profile as any).redotpay_profile_link || '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          avatar_url: formData.avatar_url,
          bio: formData.bio,
          phone: formData.phone,
          bybit_profile_link: formData.bybit_profile_link,
          deriv_profile_link: formData.deriv_profile_link,
          binance_profile_link: formData.binance_profile_link,
          redotpay_profile_link: formData.redotpay_profile_link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' });
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast({ title: 'Erro ao atualizar', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleExchangeAvatarUpload = async (field: string, url: string) => {
    if (!user?.id) return;
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

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile?.email) return profile.email.slice(0, 2).toUpperCase();
    return 'U';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-48 h-4" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  const profileData = profile as any;

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Main Profile Avatar */}
          {isEditing && user ? (
            <AvatarUpload
              currentAvatarUrl={formData.avatar_url || profile?.avatar_url}
              userId={user.id}
              initials={getInitials()}
              onUploadComplete={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
              disabled={saving}
            />
          ) : (
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Name, Email, Balance below avatar */}
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {profile?.display_name || profile?.email?.split('@')[0] || 'Usuário'}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Mail className="w-3 h-3" />
              {profile?.email}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-2xl font-bold text-primary">
                {profile?.coins?.toLocaleString() || 0}
              </span>
              <span className="text-sm text-muted-foreground">IMCH</span>
              <span className="text-xs text-muted-foreground">(≈ ${profile?.coins?.toLocaleString() || 0} USD)</span>
            </div>
          </div>

          {/* Exchange Profile Icons Row */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/50 w-full justify-center">
            <ExchangeAvatar
              name="Bybit"
              avatarUrl={profileData?.bybit_avatar_url}
              profileLink={profileData?.bybit_profile_link}
              userId={user?.id || ''}
              onUploadComplete={(url) => handleExchangeAvatarUpload('bybit_avatar_url', url)}
              fallbackColor="bg-orange-500/20 text-orange-400"
              fallbackText="BB"
            />
            <ExchangeAvatar
              name="Deriv"
              avatarUrl={profileData?.deriv_avatar_url}
              profileLink={profileData?.deriv_profile_link}
              userId={user?.id || ''}
              onUploadComplete={(url) => handleExchangeAvatarUpload('deriv_avatar_url', url)}
              fallbackColor="bg-red-500/20 text-red-400"
              fallbackText="DV"
            />
            <ExchangeAvatar
              name="Binance"
              avatarUrl={profileData?.binance_avatar_url}
              profileLink={profileData?.binance_profile_link}
              userId={user?.id || ''}
              onUploadComplete={(url) => handleExchangeAvatarUpload('binance_avatar_url', url)}
              fallbackColor="bg-yellow-500/20 text-yellow-400"
              fallbackText="BN"
            />
            <ExchangeAvatar
              name="Redotpay"
              avatarUrl={profileData?.redotpay_avatar_url}
              profileLink={profileData?.redotpay_profile_link}
              userId={user?.id || ''}
              onUploadComplete={(url) => handleExchangeAvatarUpload('redotpay_avatar_url', url)}
              fallbackColor="bg-blue-500/20 text-blue-400"
              fallbackText="RP"
            />
          </div>

          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="mt-1">
              Editar Perfil
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="display_name" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Nome de Exibição
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Seu nome"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+244 9XX XXX XXX"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                className="bg-background/50 min-h-[60px]"
              />
            </div>

            {/* Exchange profile links */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <LinkIcon className="w-4 h-4" /> Links das Exchanges
              </Label>
              {[
                { key: 'bybit_profile_link', label: 'Bybit', placeholder: 'https://www.bybit.com/...' },
                { key: 'deriv_profile_link', label: 'Deriv', placeholder: 'https://app.deriv.com/...' },
                { key: 'binance_profile_link', label: 'Binance', placeholder: 'https://www.binance.com/...' },
                { key: 'redotpay_profile_link', label: 'Redotpay', placeholder: 'https://www.redotpay.com/...' },
              ].map((exchange) => (
                <Input
                  key={exchange.key}
                  value={(formData as any)[exchange.key]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [exchange.key]: e.target.value }))}
                  placeholder={exchange.placeholder}
                  className="bg-background/50 text-xs"
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {profile?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.bio && (
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
