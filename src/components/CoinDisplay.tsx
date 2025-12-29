interface CoinDisplayProps {
  coins: number;
  euroValue: number;
}

export const CoinDisplay = ({ coins, euroValue }: CoinDisplayProps) => {
  return (
    <div className="glass-card p-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-4xl">🪙</span>
        <span className="font-display font-bold text-5xl text-primary neon-text-green">
          {coins.toLocaleString()}
        </span>
      </div>
      <p className="text-muted-foreground font-medium">
        COINS
      </p>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-muted-foreground text-sm mb-1">Valor equivalente</p>
        <p className="font-display font-bold text-2xl text-secondary neon-text-purple">
          € {euroValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};
