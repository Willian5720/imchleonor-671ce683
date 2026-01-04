import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Coins } from 'lucide-react';

interface ManualTransferProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (coins: number) => Promise<boolean>;
  currentCoins: number;
  isProcessing: boolean;
}

export const ManualTransfer = ({
  isOpen,
  onClose,
  onTransfer,
  currentCoins,
  isProcessing,
}: ManualTransferProps) => {
  const [inputCoins, setInputCoins] = useState('');
  const [inputUsdt, setInputUsdt] = useState('');
  const [mode, setMode] = useState<'coins' | 'usdt'>('usdt');

  const handleCoinsChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    setInputCoins(numValue);
    if (numValue) {
      setInputUsdt((parseFloat(numValue) * 100).toFixed(2));
    } else {
      setInputUsdt('');
    }
  };

  const handleUsdtChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    setInputUsdt(numValue);
    if (numValue) {
      setInputCoins((parseFloat(numValue) / 100).toFixed(4));
    } else {
      setInputCoins('');
    }
  };

  const handleTransfer = async () => {
    const coinsToTransfer = parseFloat(inputCoins);
    if (isNaN(coinsToTransfer) || coinsToTransfer <= 0) return;
    
    const success = await onTransfer(coinsToTransfer);
    if (success) {
      setInputCoins('');
      setInputUsdt('');
      onClose();
    }
  };

  const coinsValue = parseFloat(inputCoins) || 0;
  const isValid = coinsValue > 0 && coinsValue <= currentCoins;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary neon-text-green flex items-center gap-2">
            <Send className="w-5 h-5" />
            Transferência Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current balance info */}
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Saldo atual:</span>
              <div className="text-right">
                <span className="text-primary font-display font-bold">
                  {currentCoins.toFixed(2)} IMCH
                </span>
                <span className="text-muted-foreground text-xs block">
                  ≈ {(currentCoins * 100).toFixed(2)} USDT
                </span>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'usdt' ? 'default' : 'outline'}
              onClick={() => setMode('usdt')}
              className="flex-1 font-display"
              size="sm"
            >
              Valor em USDT
            </Button>
            <Button
              variant={mode === 'coins' ? 'default' : 'outline'}
              onClick={() => setMode('coins')}
              className="flex-1 font-display"
              size="sm"
            >
              Valor em IMCH
            </Button>
          </div>

          {/* Input fields */}
          {mode === 'usdt' ? (
            <div className="space-y-2">
              <Label htmlFor="usdt" className="text-muted-foreground">
                Valor em USDT
              </Label>
              <div className="relative">
                <Input
                  id="usdt"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={inputUsdt}
                  onChange={(e) => handleUsdtChange(e.target.value)}
                  className="bg-card border-border text-foreground text-lg pr-16 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  USDT
                </span>
              </div>
              {inputCoins && (
                <p className="text-xs text-muted-foreground">
                  = {inputCoins} IMCH Coins
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="coins" className="text-muted-foreground">
                Quantidade de IMCH Coins
              </Label>
              <div className="relative">
                <Input
                  id="coins"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={inputCoins}
                  onChange={(e) => handleCoinsChange(e.target.value)}
                  className="bg-card border-border text-foreground text-lg pr-16 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  IMCH
                </span>
              </div>
              {inputUsdt && (
                <p className="text-xs text-muted-foreground">
                  = {inputUsdt} USDT
                </p>
              )}
            </div>
          )}

          {/* Quick amount buttons */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Valores rápidos:</Label>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((percent) => {
                const coinsAmount = (currentCoins * percent) / 100;
                return (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputCoins(coinsAmount.toFixed(4));
                      setInputUsdt((coinsAmount * 100).toFixed(2));
                    }}
                    className="text-xs"
                    disabled={currentCoins <= 0}
                  >
                    {percent}%
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Validation message */}
          {coinsValue > currentCoins && (
            <p className="text-destructive text-sm">
              Valor excede o saldo disponível
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!isValid || isProcessing}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-display"
            >
              {isProcessing ? (
                <>Processando...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Transferir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
