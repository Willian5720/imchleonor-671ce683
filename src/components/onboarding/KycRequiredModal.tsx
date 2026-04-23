import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KycVerification } from '@/components/profile/KycVerification';

interface KycRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, user cannot dismiss without verifying */
  blocking?: boolean;
}

export function KycRequiredModal({ open, onClose, blocking = false }: KycRequiredModalProps) {
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
