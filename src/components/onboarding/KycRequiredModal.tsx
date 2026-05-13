import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KycVerification } from '@/components/profile/KycVerification';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useEffect } from 'react';

interface KycRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, user cannot dismiss without verifying */
  blocking?: boolean;
}

export function KycRequiredModal({ open, onClose, blocking = false }: KycRequiredModalProps) {
  const { isVerified } = useKycStatus();

  // Auto-close as soon as verification is approved
  useEffect(() => {
    if (open && isVerified) {
      const t = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(t);
    }
  }, [open, isVerified, onClose]);

  if (isVerified) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <DialogTitle className="text-center">Verificação Concluída</DialogTitle>
            <DialogDescription className="text-center">
              Sua identidade foi verificada com sucesso. Você já pode usar todos os recursos da plataforma.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={onClose}>Continuar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !blocking) onClose(); }}>
      <DialogContent
        className="sm:max-w-md bg-background border-border"
        onInteractOutside={(e) => { if (blocking) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (blocking) e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center">Verifique a sua identidade</DialogTitle>
          <DialogDescription className="text-center">
            Para validar transações na plataforma, precisamos confirmar o seu documento de identidade e uma selfie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Sem verificação, você não poderá enviar, sacar nem trocar fundos.
            </p>
          </div>

          <KycVerification />

          {!blocking && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onClose}
            >
              Verificar mais tarde
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
