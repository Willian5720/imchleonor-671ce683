import { useState, useRef } from 'react';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  initials: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userId, 
  initials, 
  onUploadComplete,
  disabled = false 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem (JPEG, PNG, GIF ou WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL (bucket is private)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlError) throw urlError;
      onUploadComplete(urlData.signedUrl);
      
      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi alterada com sucesso',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer o upload da imagem. Tente novamente.',
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative">
      <Avatar className="w-24 h-24 border-2 border-primary/30">
        <AvatarImage 
          src={displayUrl || undefined} 
          alt="Avatar" 
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Upload button overlay */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <Button
        size="icon"
        variant="secondary"
        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-lg"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>

      {/* Preview cancel button */}
      {previewUrl && !uploading && (
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
          onClick={clearPreview}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Upload hint */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
