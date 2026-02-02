import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface TwoFactorVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorVerification = ({ onSuccess, onCancel }: TwoFactorVerificationProps) => {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFactors = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        
        const totpFactor = data.totp.find(f => f.status === 'verified');
        if (totpFactor) {
          setFactorId(totpFactor.id);
        } else {
          // No verified factor found - user needs to set up 2FA first
          toast({
            title: 'Configuração necessária',
            description: 'Você precisa configurar o 2FA primeiro.',
            variant: 'destructive',
          });
          onCancel();
          return;
        }
      } catch (error) {
        console.error('Error getting factors:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar configurações de 2FA.',
          variant: 'destructive',
        });
        onCancel();
        return;
      } finally {
        setLoading(false);
      }
    };

    getFactors();
  }, [toast, onCancel]);

  const handleVerify = async () => {
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

      // Log the 2FA verification
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const jsonDetails = JSON.parse(JSON.stringify({ action: 'login_2fa_verified' }));
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action: '2fa_verified',
          p_entity_type: 'auth',
          p_entity_id: null,
          p_details: jsonDetails
        });
      }

      toast({
        title: 'Verificação concluída!',
        description: 'Login realizado com sucesso.',
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

  const handleCancel = async () => {
    await supabase.auth.signOut();
    onCancel();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Verificação em 2 Fatores</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp" className="sr-only">Código de verificação</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleVerify}
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
          onClick={handleVerify}
          disabled={verifying || verificationCode.length !== 6}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-green"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar'
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleCancel}
          className="w-full text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o login
        </Button>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        <p>Use seu aplicativo autenticador:</p>
        <p className="mt-1">Google Authenticator, Authy ou Microsoft Authenticator</p>
      </div>
    </div>
  );
};
