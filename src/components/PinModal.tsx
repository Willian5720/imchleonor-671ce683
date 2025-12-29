import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFail: () => boolean; // Returns true if account was wiped
  attemptsLeft: number;
}

const CORRECT_PIN = '1234';

export const PinModal = ({ isOpen, onClose, onSuccess, onFail, attemptsLeft }: PinModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isWiped, setIsWiped] = useState(false);

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      setPin('');
      setError('');
      onSuccess();
    } else {
      const wiped = onFail();
      if (wiped) {
        setIsWiped(true);
        setError('⚠️ CONTA BLOQUEADA - Todos os dados foram apagados!');
      } else {
        setError(`PIN incorreto! ${attemptsLeft - 1} tentativa(s) restante(s)`);
      }
      setPin('');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    setIsWiped(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-primary neon-text-green">
            🔐 ACESSO SEGURO
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Digite o PIN de 4 dígitos para acessar o saque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder="• • • •"
            className="text-center text-2xl tracking-[1em] bg-background/50 border-border h-14 font-mono"
            autoFocus
          />

          {error && (
            <p className={`text-center text-sm ${isWiped ? 'text-destructive' : 'text-destructive/80'}`}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pin.length !== 4 || isWiped}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-green"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
