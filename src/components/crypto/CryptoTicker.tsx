import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

export function CryptoTicker() {
  const { prices, loading } = useCryptoPrices(15000);

  if (loading || prices.length === 0) {
    return null;
  }

  // Show top 5 by volume
  const topCryptos = prices.slice(0, 5);

  return (
    <div className="w-full overflow-hidden bg-background/50 backdrop-blur border-b border-border/50 py-2">
      <div className="flex animate-marquee gap-8 px-4">
        {[...topCryptos, ...topCryptos].map((crypto, index) => {
          const isPositive = crypto.change24h >= 0;
          
          return (
            <div 
              key={`${crypto.symbol}-${index}`}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-lg">{crypto.icon}</span>
              <span className="font-medium text-foreground">{crypto.symbol}</span>
              <span className="text-muted-foreground">
                ${crypto.price >= 1 ? crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : crypto.price.toFixed(4)}
              </span>
              <span className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
