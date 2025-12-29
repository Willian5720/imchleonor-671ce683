import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface WithdrawButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

const TAPS_REQUIRED = 5;

export const WithdrawButton = ({ isVisible, onClick }: WithdrawButtonProps) => {
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    
    // Reset if more than 2 seconds between taps
    if (now - lastTap > 2000) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }
    
    setLastTap(now);

    if (tapCount + 1 >= TAPS_REQUIRED) {
      setShowButton(true);
      setTapCount(0);
    }
  }, [tapCount, lastTap]);

  if (!isVisible) {
    return (
      <div 
        className="fixed top-4 left-4 w-12 h-12 cursor-default"
        onClick={handleSecretTap}
      >
        {/* Invisible tap zone */}
        {tapCount > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/30">
              {TAPS_REQUIRED - tapCount}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (!showButton && isVisible) {
    // Auto-show if coins > 0
    setShowButton(true);
  }

  if (!showButton) return null;

  return (
    <Button
      onClick={onClick}
      className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-display font-bold px-8 py-6 text-lg neon-glow-purple hover:scale-105 transition-transform"
    >
      💸 SACAR € {/* Will show value in parent */}
    </Button>
  );
};
