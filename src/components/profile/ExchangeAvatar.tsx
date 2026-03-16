import { useState, useRef } from 'react';
import { Camera, Loader2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExchangeAvatarProps {
  name: string;
  avatarUrl?: string | null;
  profileLink?: string | null;
  userId: string;
  onUploadComplete: (url: string) => void;
  fallbackColor: string;
  fallbackText: string;
}

export function ExchangeAvatar({
  name,
  avatarUrl,
  profileLink,
  userId,
  onUploadComplete,
  fallbackColor,
  fallbackText,
}: ExchangeAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Tipo inválido', description: 'Use JPEG, PNG, GIF ou WebP', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${name.toLowerCase()}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      onUploadComplete(urlData.publicUrl);
      toast({ title: `Foto ${name} atualizada` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative group cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Avatar
          className="w-12 h-12 border-2 border-border hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <AvatarImage src={avatarUrl || undefined} className="object-cover" />
          <AvatarFallback className={`${fallbackColor} text-xs font-bold`}>
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        )}

        <div
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        >
          <Camera className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {profileLink ? (
        <a
          href={profileLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
        >
          {name}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ) : (
        <span className="text-[10px] text-muted-foreground">{name}</span>
      )}
    </div>
  );
}
