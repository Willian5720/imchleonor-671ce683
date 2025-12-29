import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  coins: number;
  euroValue: number;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, coins, euroValue }: ConfirmModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStatus('idle');
    
    try {
      await onConfirm();
      setStatus('success');
      setMessage('✅ Saque solicitado com sucesso!');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Erro: ${error.message || 'Falha ao processar saque'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStatus('idle');
      setMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-secondary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-secondary neon-text-purple">
            💰 CONFIRMAR SAQUE
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Você está prestes a converter seus coins em euros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="glass-card p-4 bg-background/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted-foreground">Coins:</span>
              <span className="font-display font-bold text-xl text-primary">
                🪙 {coins.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-display font-bold text-2xl text-secondary neon-text-purple">
                € {euroValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {message && (
            <p className={`text-center text-sm ${status === 'error' ? 'text-destructive' : 'text-primary'}`}>
              {message}
            </p>
          )}

          {status === 'idle' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 border-border hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 neon-glow-purple"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processando...
                  </span>
                ) : (
                  'Sacar Agora'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
