import { useEffect, useState } from 'react';

interface FloatingCoinProps {
  id: number;
  x: number;
  y: number;
  onComplete: (id: number) => void;
}

export const FloatingCoin = ({ id, x, y, onComplete }: FloatingCoinProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(id);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 animate-float-up"
      style={{ left: x - 20, top: y - 20 }}
    >
      <div className="flex items-center gap-1 text-primary font-display font-bold text-xl neon-text-green">
        <span className="text-2xl">💎</span>
        <span>+1 IMCH</span>
      </div>
    </div>
  );
};
