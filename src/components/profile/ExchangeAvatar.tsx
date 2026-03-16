import { useState, useRef } from 'react';
import { Camera, Loader2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EXCHANGE_URLS: Record<string, string> = {
  Bybit: 'https://www.bybit.com',
  Deriv: 'https://www.deriv.com',
  Binance: 'https://www.binance.com',
  Redotpay: 'https://www.redotpay.com',
};

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
  const [open, setOpen] = useState(false);
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

  const exchangeUrl = profileLink || EXCHANGE_URLS[name] || '#';

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative group cursor-pointer">
            <Avatar className="w-12 h-12 border-2 border-border hover:border-primary/50 transition-colors">
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
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-48 p-2" side="bottom" align="center">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => {
                setOpen(false);
                fileInputRef.current?.click();
              }}
            >
              <Camera className="w-3.5 h-3.5" />
              Mudar foto de perfil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              asChild
            >
              <a href={exchangeUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                <ExternalLink className="w-3.5 h-3.5" />
                Ir para {name}
              </a>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-[10px] text-muted-foreground">{name}</span>
    </div>
  );
}
