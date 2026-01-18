import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';

export const TwoFactorAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const check2FAStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data.totp.find(f => f.status === 'verified');
      setIs2FAEnabled(!!totpFactor);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const startEnrollment = async () => {
    if (!user) return;
    
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'CASA DA CRIPTO IMCH',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Erro ao iniciar 2FA',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) return;
    
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
      const jsonDetails = JSON.parse(JSON.stringify({ action: 'enabled' }));
      await supabase.rpc('log_user_action', {
        p_user_id: user!.id,
        p_action: '2fa_enabled',
        p_entity_type: 'security',
        p_entity_id: null,
        p_details: jsonDetails
      });

      toast({
        title: '2FA Ativado!',
        description: 'Autenticação de dois fatores foi ativada com sucesso.',
      });

      setIs2FAEnabled(true);
      setDialogOpen(false);
      resetState();
    } catch (error) {
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = data.totp.find(f => f.status === 'verified');
      if (!totpFactor) {
        toast({
          title: 'Erro',
          description: '2FA não está ativado.',
          variant: 'destructive',
        });
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (unenrollError) throw unenrollError;

      // Log the 2FA deactivation
      const jsonDetails = JSON.parse(JSON.stringify({ action: 'disabled' }));
      await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: '2fa_disabled',
        p_entity_type: 'security',
        p_entity_id: null,
        p_details: jsonDetails
      });

      toast({
        title: '2FA Desativado',
        description: 'Autenticação de dois fatores foi desativada.',
      });

      setIs2FAEnabled(false);
    } catch (error) {
      toast({
        title: 'Erro ao desativar 2FA',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check status on mount
  useState(() => {
    check2FAStatus();
  });

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Autenticação em 2 Fatores
            </CardTitle>
            <CardDescription>
              Adicione uma camada extra de segurança à sua conta
            </CardDescription>
          </div>
          {is2FAEnabled ? (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Ativado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <ShieldOff className="w-3 h-3 mr-1" />
              Desativado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A autenticação de dois fatores (2FA) adiciona uma camada extra de segurança 
          exigindo um código do seu aplicativo autenticador além da senha.
        </p>

        {is2FAEnabled ? (
          <Button 
            variant="destructive" 
            onClick={disable2FA}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShieldOff className="w-4 h-4 mr-2" />
            )}
            Desativar 2FA
          </Button>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={startEnrollment}
                disabled={enrolling}
                className="w-full bg-primary text-primary-foreground"
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Ativar 2FA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Configurar Autenticação 2FA
                </DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {qrCode && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                    </div>
                  </div>
                )}

                {secret && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Ou insira o código manualmente:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={secret}
                        readOnly
                        className="font-mono text-xs"
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

                <div className="space-y-2">
                  <Label htmlFor="verification-code">Código de Verificação</Label>
                  <Input
                    id="verification-code"
                    placeholder="Digite o código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={verifyAndEnable}
                  disabled={verifying || verificationCode.length !== 6}
                  className="w-full"
                >
                  {verifying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  Verificar e Ativar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>📱 Apps recomendados:</p>
          <ul className="list-disc list-inside pl-2">
            <li>Google Authenticator</li>
            <li>Authy</li>
            <li>Microsoft Authenticator</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
