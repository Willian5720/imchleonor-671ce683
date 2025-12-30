import { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { MinerButton } from '@/components/MinerButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { FloatingCoin } from '@/components/FloatingCoin';
import { PinModal } from '@/components/PinModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Button } from '@/components/ui/button';
import { createStripePayout } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

interface FloatingCoinData {
  id: number;
  x: number;
  y: number;
}

const Index = () => {
  const { 
    coins, 
    addCoin, 
    resetCoins, 
    getEuroValue, 
    pinAttempts, 
    incrementPinAttempts, 
    resetPinAttempts,
    COIN_VALUE_EUR,
    isLoaded 
  } = useGameState();
  
  const { playCoinSound, playSuccessSound, playErrorSound } = useSound();
  const { settings } = usePaymentSettings();
  const { toast } = useToast();

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoinData[]>([]);
  const [coinIdCounter, setCoinIdCounter] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Secret tap state
  const [secretTaps, setSecretTaps] = useState(0);
  const [lastSecretTap, setLastSecretTap] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleMine = useCallback((e: React.MouseEvent) => {
    addCoin();
    playCoinSound();

    // Add floating coin animation
    const newCoin: FloatingCoinData = {
      id: coinIdCounter,
      x: e.clientX,
      y: e.clientY,
    };
    
    setFloatingCoins(prev => [...prev, newCoin]);
    setCoinIdCounter(prev => prev + 1);
  }, [addCoin, playCoinSound, coinIdCounter]);

  const handleFloatingCoinComplete = useCallback((id: number) => {
    setFloatingCoins(prev => prev.filter(coin => coin.id !== id));
  }, []);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    
    if (now - lastSecretTap > 2000) {
      setSecretTaps(1);
    } else {
      setSecretTaps(prev => prev + 1);
    }
    
    setLastSecretTap(now);

    if (secretTaps + 1 >= 5) {
      setShowWithdraw(true);
      setSecretTaps(0);
    }
  }, [secretTaps, lastSecretTap]);

  const handleWithdrawClick = () => {
    if (coins <= 0) {
      toast({
        title: "Sem saldo",
        description: "Você precisa de pelo menos 1 coin para sacar.",
        variant: "destructive",
      });
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    resetPinAttempts();
    setShowConfirmModal(true);
    playSuccessSound();
  };

  const handlePinFail = () => {
    playErrorSound();
    return incrementPinAttempts();
  };

  const handleConfirmWithdraw = async () => {
    const euroValue = getEuroValue();
    const email = settings.stripe.email;
    
    if (!email) {
      throw new Error('Configure seu email do Stripe nas configurações');
    }
    
    const result = await createStripePayout(euroValue, email);
    
    if (result.success) {
      playSuccessSound();
      resetCoins();
      toast({
        title: "Saque realizado! 💰",
        description: `€ ${euroValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} enviado para ${email} via Stripe.`,
      });
    } else {
      throw new Error(result.error || 'Falha ao processar saque');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-display text-2xl animate-pulse neon-text-green">
          Carregando...
        </div>
      </div>
    );
  }

  const euroValue = getEuroValue();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-green/5 via-background to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-purple/10 blur-[100px] rounded-full" />
      
      {/* Settings button (top-right corner) */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card hover:border-primary/50 transition-all group"
      >
        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* Secret tap zone (top-left corner) */}
      <div 
        className="fixed top-0 left-0 w-16 h-16 z-50 cursor-default"
        onClick={handleSecretTap}
      >
        {secretTaps > 0 && (
          <span className="absolute top-2 left-2 text-xs text-muted-foreground/20">
            {5 - secretTaps}
          </span>
        )}
      </div>

      {/* Floating coins */}
      {floatingCoins.map(coin => (
        <FloatingCoin
          key={coin.id}
          id={coin.id}
          x={coin.x}
          y={coin.y}
          onComplete={handleFloatingCoinComplete}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 gap-8">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-display font-black text-4xl md:text-5xl text-primary neon-text-green mb-2">
            NEON MINER
          </h1>
          <p className="text-muted-foreground text-sm">
            1 Coin = € {COIN_VALUE_EUR}
          </p>
        </div>

        {/* Coin display */}
        <CoinDisplay coins={coins} euroValue={euroValue} />

        {/* Miner button */}
        <MinerButton onClick={handleMine} />

        {/* Withdraw button (only visible after secret taps or if has coins) */}
        {(showWithdraw || coins > 0) && (
          <Button
            onClick={handleWithdrawClick}
            className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-display font-bold px-8 py-6 text-lg neon-glow-purple hover:scale-105 transition-transform mt-4"
          >
            💸 SACAR € {euroValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
          </Button>
        )}

        {/* Footer */}
        <p className="text-muted-foreground/50 text-xs mt-8">
          🔒 Transações seguras via {settings.activeGateway === 'stripe' ? 'Stripe' : 'PayPal'}
        </p>
      </div>

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        onFail={handlePinFail}
        attemptsLeft={3 - pinAttempts}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmWithdraw}
        coins={coins}
        euroValue={euroValue}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default Index;
