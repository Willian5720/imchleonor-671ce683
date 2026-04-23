import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Camera, Upload, Loader2, CheckCircle2, Clock, ShieldX, AlertTriangle, X } from 'lucide-react';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateImageFile } from '@/lib/imageValidation';

type Slot = 'selfie' | 'bi_front' | 'bi_back';

const SLOT_META: Record<Slot, { label: string; hint: string; useCamera: boolean }> = {
  selfie:   { label: 'Foto do Rosto (Selfie)', hint: 'Foto nítida do seu rosto, sem óculos escuros ou chapéu.', useCamera: true },
  bi_front: { label: 'Documento — Frente',    hint: 'Lado da frente do seu documento de identidade.',           useCamera: false },
  bi_back:  { label: 'Documento — Verso',     hint: 'Lado de trás do seu documento de identidade.',             useCamera: false },
};

export function KycVerification() {
  const { user } = useAuth();
  const { kyc, isVerified, isPending, isRejected, hasSubmitted, loading, refetch } = useKycStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState<Record<Slot, File | null>>({
    selfie: null, bi_front: null, bi_back: null,
  });
  const [previews, setPreviews] = useState<Record<Slot, string | null>>({
    selfie: null, bi_front: null, bi_back: null,
  });

  const inputRefs: Record<Slot, React.RefObject<HTMLInputElement>> = {
    selfie: useRef<HTMLInputElement>(null),
    bi_front: useRef<HTMLInputElement>(null),
    bi_back: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = (slot: Slot) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRefs[slot].current) inputRefs[slot].current!.value = '';
    if (!file) return;

    // Selfies podem ter resolução um pouco menor do que documentos
    const isSelfie = slot === 'selfie';
    const result = await validateImageFile(file, {
      minWidth: isSelfie ? 360 : 600,
      minHeight: isSelfie ? 360 : 400,
      minSharpness: isSelfie ? 50 : 80,
    });

    if (!result.ok) {
      toast.error(result.error || 'Imagem inválida.');
      return;
    }

    setFiles((prev) => ({ ...prev, [slot]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviews((prev) => ({ ...prev, [slot]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeSlot = (slot: Slot) => {
    setFiles((prev) => ({ ...prev, [slot]: null }));
    setPreviews((prev) => ({ ...prev, [slot]: null }));
    if (inputRefs[slot].current) inputRefs[slot].current!.value = '';
  };

  const allReady = !!(files.selfie && files.bi_front && files.bi_back);

  const uploadAndSign = async (slot: Slot, file: File): Promise<{ path: string; signedUrl: string }> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/kyc-${slot}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
    if (error || !data) throw error || new Error('Erro ao assinar URL');
    return { path, signedUrl: data.signedUrl };
  };

  const handleSubmit = async () => {
    if (!user || !allReady) return;
    setProcessing(true);
    try {
      // Upload the 3 images and get signed URLs
      const [selfie, biFront, biBack] = await Promise.all([
        uploadAndSign('selfie', files.selfie!),
        uploadAndSign('bi_front', files.bi_front!),
        uploadAndSign('bi_back', files.bi_back!),
      ]);

      // Validate via AI
      const { data: result, error: extractError } = await supabase.functions.invoke('extract-document-data', {
        body: {
          selfie_url: selfie.signedUrl,
          bi_front_url: biFront.signedUrl,
          bi_back_url: biBack.signedUrl,
        },
      });
      if (extractError) throw extractError;

      const verified = !!result?.verified;
      const rejectionReason = result?.rejection_reason || null;
      const extracted = result?.data || {};

      const kycData = {
        user_id: user.id,
        status: verified ? 'approved' : 'rejected',
        document_type: 'bilhete_identidade',
        document_number: extracted.document_number || null,
        full_name: extracted.full_name || null,
        date_of_birth: extracted.date_of_birth || null,
        document_image_url: biFront.path,
        extracted_data: { ...extracted, checks: result?.checks, selfie_path: selfie.path, bi_back_path: biBack.path },
        rejection_reason: verified ? null : rejectionReason,
        verified_at: verified ? new Date().toISOString() : null,
      };

      if (hasSubmitted) {
        const { error } = await supabase.from('kyc_verifications').update(kycData).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kyc_verifications').insert(kycData);
        if (error) throw error;
      }

      if (verified) {
        toast.success('Verificação aprovada! Sua conta está verificada.');
        setDialogOpen(false);
        setFiles({ selfie: null, bi_front: null, bi_back: null });
        setPreviews({ selfie: null, bi_front: null, bi_back: null });
      } else {
        toast.error(rejectionReason || 'Verificação rejeitada. Tente novamente com fotos melhores.');
      }
      refetch();
    } catch (error) {
      console.error('KYC error:', error);
      toast.error('Erro ao processar verificação. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return null;

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

  if (isPending) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">Verificação em Análise</p>
            <p className="text-xs text-muted-foreground">Seu documento está sendo analisado.</p>
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
              {isRejected ? <ShieldX className="w-6 h-6 text-destructive" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {isRejected ? 'Verificação Rejeitada' : 'Verifique sua Conta'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRejected
                  ? (kyc?.rejection_reason || 'Envie novamente as suas fotos.')
                  : 'Envie uma selfie e as duas faces do seu documento de identidade para verificar.'}
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              {isRejected ? 'Reenviar' : 'Verificar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Verificação de Identidade
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Envie as <strong>3 fotos</strong> abaixo. A verificação só é aprovada se a selfie corresponder ao rosto no seu documento de identidade.
            </p>

            {(['selfie', 'bi_front', 'bi_back'] as Slot[]).map((slot) => {
              const meta = SLOT_META[slot];
              const preview = previews[slot];
              return (
                <div key={slot} className="space-y-2">
                  <Label className="text-sm font-medium">{meta.label}</Label>
                  <p className="text-xs text-muted-foreground">{meta.hint}</p>

                  {preview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={preview} alt={meta.label} className="w-full h-40 object-cover" />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeSlot(slot)}
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-20 flex-col gap-1 rounded-xl"
                      onClick={() => inputRefs[slot].current?.click()}
                      type="button"
                    >
                      {meta.useCamera ? <Camera className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                      <span className="text-xs">{meta.useCamera ? 'Tirar selfie' : 'Carregar foto'}</span>
                    </Button>
                  )}

                  <input
                    ref={inputRefs[slot]}
                    type="file"
                    accept="image/*"
                    {...(meta.useCamera ? { capture: 'user' as const } : {})}
                    className="hidden"
                    onChange={handleFileSelect(slot)}
                  />
                </div>
              );
            })}

            <Button
              onClick={handleSubmit}
              disabled={!allReady || processing}
              className="w-full h-12 rounded-xl"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validando documentos...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Enviar para Verificação
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
