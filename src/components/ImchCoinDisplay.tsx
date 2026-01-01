interface ImchCoinDisplayProps {
  coins: number;
  usdtValue: number;
  threshold: number;
}

export const ImchCoinDisplay = ({ coins, usdtValue, threshold }: ImchCoinDisplayProps) => {
  const progress = Math.min((usdtValue / threshold) * 100, 100);
  
  return (
    <div className="glass-card p-6 text-center w-full max-w-md">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-4xl">💎</span>
        <span className="font-display font-bold text-5xl text-primary neon-text-green">
          {coins.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <p className="text-muted-foreground font-medium mb-4">
        IMCH COINS
      </p>
      
      <div className="border-t border-border pt-4">
        <p className="text-muted-foreground text-sm mb-1">Equivalente em USDT</p>
        <p className="font-display font-bold text-2xl text-secondary neon-text-purple">
          $ {usdtValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progresso para transferência</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Meta: {threshold.toLocaleString('pt-BR')} USDT
        </p>
      </div>
    </div>
  );
};
