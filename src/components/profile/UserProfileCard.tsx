import { useState } from 'react';
import { User, Mail, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '@/hooks/useAuth';

export function UserProfileCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, loading, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_url: '',
    bio: '',
    phone: '',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(formData);
    setSaving(false);

    if (result.success) {
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
      setIsEditing(false);
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-48 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
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
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {profile?.display_name || profile?.email?.split('@')[0] || 'Usuário'}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {profile?.email}
              </CardDescription>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {profile?.coins?.toLocaleString() || 0}
                </span>
                <span className="text-sm text-muted-foreground">COINS</span>
              </div>
            </div>
          </div>
          
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
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
                <User className="w-4 h-4" />
                Nome de Exibição
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
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                className="bg-background/50 min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
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
