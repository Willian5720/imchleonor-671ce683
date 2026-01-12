import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface CryptoCardProps {
  crypto: CryptoPrice;
  onDetails?: (symbol: string) => void;
}

export function CryptoCard({ crypto, onDetails }: CryptoCardProps) {
  const isPositive = crypto.change24h >= 0;
  
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card/80 to-card border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {crypto.icon}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{crypto.name}</h3>
              <span className="text-sm text-muted-foreground">{crypto.symbol}</span>
            </div>
          </div>
          <Badge 
            variant={isPositive ? 'default' : 'destructive'}
            className={`flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-foreground">
            {formatPrice(crypto.price)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">24h High</span>
              <p className="text-green-500 font-medium">{formatPrice(crypto.high24h)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">24h Low</span>
              <p className="text-red-500 font-medium">{formatPrice(crypto.low24h)}</p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Volume 24h</span>
                <p className="text-sm font-medium text-foreground">{formatVolume(crypto.volume24h)}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-primary hover:text-primary/80"
                onClick={() => window.open(`https://www.bybit.com/trade/spot/${crypto.symbol}/USDT`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Trade
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
