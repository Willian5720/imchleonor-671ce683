import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Copy, Check, ShieldCheck } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface TwoFactorSetupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorSetup = ({ onSuccess, onCancel }: TwoFactorSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startEnrollment();
  }, []);

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'LEONOR App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error) {
      toast({
        title: 'Erro ao configurar 2FA',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || verificationCode.length !== 6) return;

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      // Log the 2FA activation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const jsonDetails = JSON.parse(JSON.stringify({ action: 'enabled_on_login' }));
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action: '2fa_enabled',
          p_entity_type: 'security',
          p_entity_id: null,
          p_details: jsonDetails
        });
      }

      toast({
        title: '2FA Ativado!',
        description: 'Autenticação de dois fatores configurada com sucesso.',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
      setVerificationCode('');
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancel = async () => {
    // Unenroll any pending factor
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    await supabase.auth.signOut();
    onCancel();
  };

  if (loading || enrolling) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Configurando 2FA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Configurar Autenticação 2FA</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          A autenticação em dois fatores é obrigatória. Configure agora para continuar.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1: QR Code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">1. Escaneie o QR Code</Label>
          {qrCode && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40" />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Manual code */}
        {secret && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">2. Ou insira o código manualmente:</Label>
            <div className="flex gap-2">
              <Input
                value={secret}
                readOnly
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copySecret}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verification code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">3. Digite o código de verificação:</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={verifyAndEnable}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button
          onClick={verifyAndEnable}
          disabled={verifying || verificationCode.length !== 6}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-green"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Ativar 2FA e Continuar
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleCancel}
          className="w-full text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-center text-muted-foreground space-y-1">
        <p>📱 Apps recomendados:</p>
        <p>Google Authenticator • Authy • Microsoft Authenticator</p>
      </div>
    </div>
  );
};
