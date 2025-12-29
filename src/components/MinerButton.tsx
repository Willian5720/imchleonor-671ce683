import { useState } from 'react';

interface MinerButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const MinerButton = ({ onClick }: MinerButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setIsPressed(true);
    onClick(e);
    setTimeout(() => setIsPressed(false), 100);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-48 h-48 rounded-full 
        bg-gradient-to-br from-neon-green/20 to-neon-purple/20
        border-4 border-primary
        transition-all duration-100 ease-out
        hover:scale-105 active:scale-95
        ${isPressed ? 'scale-95' : ''}
        animate-pulse-glow
        group
      `}
    >
      {/* Inner glow */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-xl" />
      
      {/* Icon container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <span className="text-6xl mb-2 group-hover:animate-coin-spin">⛏️</span>
        <span className="font-display font-bold text-primary text-lg neon-text-green">
          MINERAR
        </span>
      </div>

      {/* Ring effect on press */}
      {isPressed && (
        <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-75" />
      )}
    </button>
  );
};
