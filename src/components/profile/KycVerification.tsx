import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Camera, Upload, Loader2, CheckCircle2, Clock, ShieldX, AlertTriangle } from 'lucide-react';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function KycVerification() {
  const { user } = useAuth();
  const { kyc, isVerified, isPending, isRejected, hasSubmitted, loading, refetch } = useKycStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<{
    full_name?: string;
    document_number?: string;
    date_of_birth?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ficheiro muito grande. Máximo: 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setExtractedData(null);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile || !user) return;

    setProcessing(true);
    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/kyc-document.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60); // 1h is enough for AI processing
      if (urlError) throw urlError;

      // Call AI to extract document data
      const { data: extractResult, error: extractError } = await supabase.functions.invoke('extract-document-data', {
        body: { image_url: urlData.signedUrl },
      });

      if (extractError) throw extractError;

      const extracted = extractResult?.data || {};
      setExtractedData({
        full_name: extracted.full_name || '',
        document_number: extracted.document_number || '',
        date_of_birth: extracted.date_of_birth || '',
      });

      // Save KYC record
      const kycData = {
        user_id: user.id,
        status: 'pending' as const,
        document_type: 'bilhete_identidade',
        document_number: extracted.document_number || null,
        full_name: extracted.full_name || null,
        date_of_birth: extracted.date_of_birth || null,
        document_image_url: filePath,
        extracted_data: extracted,
      };

      if (hasSubmitted) {
        const { error } = await supabase
          .from('kyc_verifications')
          .update(kycData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kyc_verifications')
          .insert(kycData);
        if (error) throw error;
      }

      toast.success('Documento enviado para verificação!');
      refetch();
    } catch (error) {
      console.error('KYC error:', error);
      toast.error('Erro ao processar documento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return null;

  // Already verified
  if (isVerified) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">Conta Verificada</p>
            <p className="text-xs text-muted-foreground">Sua identidade foi verificada com sucesso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending review
  if (isPending) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">Verificação em Análise</p>
            <p className="text-xs text-muted-foreground">Seu documento está sendo analisado. Aguarde a aprovação.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isRejected ? (
                <ShieldX className="w-6 h-6 text-destructive" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {isRejected ? 'Verificação Rejeitada' : 'Verifique sua Conta'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRejected 
                  ? (kyc?.rejection_reason || 'Envie novamente o seu documento')
                  : 'Envie uma foto do seu Bilhete de Identidade para verificar sua conta'
                }
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              {isRejected ? 'Reenviar' : 'Verificar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Verificação de Identidade
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Tire uma foto ou faça upload do seu Bilhete de Identidade. O sistema irá extrair os dados automaticamente.
            </p>

            {/* Image preview */}
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Documento" className="w-full h-48 object-cover" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => { setImagePreview(null); setSelectedFile(null); setExtractedData(null); }}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 rounded-xl"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Tirar Foto</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Carregar Ficheiro</span>
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Extracted data preview */}
            {extractedData && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Dados Extraídos
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                    <p className="font-medium">{extractedData.full_name || 'Não detectado'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nº do Documento</Label>
                    <p className="font-medium">{extractedData.document_number || 'Não detectado'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                    <p className="font-medium">{extractedData.date_of_birth || 'Não detectado'}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleProcessDocument}
              disabled={!selectedFile || processing}
              className="w-full h-12 rounded-xl"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando documento...
                </>
              ) : extractedData ? (
                'Enviar para Verificação'
              ) : (
                'Processar Documento'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
