import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, ChevronDown, ChevronUp, Star, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface CryptoTradingCardProps {
  crypto: CryptoPrice;
  onFavorite?: (symbol: string) => void;
  isFavorite?: boolean;
  onViewChart?: () => void;
}

export function CryptoTradingCard({ crypto, onFavorite, isFavorite, onViewChart }: CryptoTradingCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  
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

  const calculateTotal = (amount: string) => {
    const qty = parseFloat(amount) || 0;
    const price = orderType === 'limit' ? parseFloat(limitPrice) || crypto.price : crypto.price;
    return qty * price;
  };

  const handleBuy = () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }
    
    const total = calculateTotal(buyAmount);
    toast({
      title: "Ordem de Compra Simulada",
      description: `Comprar ${buyAmount} ${crypto.symbol} por ${formatPrice(total)} (${orderType === 'limit' ? 'Limite' : 'Mercado'})`,
    });
    setBuyAmount('');
  };

  const handleSell = () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }
    
    const total = calculateTotal(sellAmount);
    toast({
      title: "Ordem de Venda Simulada",
      description: `Vender ${sellAmount} ${crypto.symbol} por ${formatPrice(total)} (${orderType === 'limit' ? 'Limite' : 'Mercado'})`,
    });
    setSellAmount('');
  };

  const quickAmounts = [25, 50, 75, 100];

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br from-card/80 to-card border-border/50 hover:border-primary/30 transition-all ${expanded ? 'shadow-lg shadow-primary/10' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {crypto.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{crypto.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onFavorite?.(crypto.symbol)}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">{crypto.symbol}/USDT</span>
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
          {/* Price Info */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(crypto.price)}
            </div>
            <div className="flex gap-2">
              {onViewChart && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewChart}
                  className="text-muted-foreground"
                >
                  <LineChart className="w-4 h-4 mr-1" />
                  Gráfico
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-muted-foreground"
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                Trade
                {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">24h High</span>
              <p className="text-green-500 font-medium">{formatPrice(crypto.high24h)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">24h Low</span>
              <p className="text-red-500 font-medium">{formatPrice(crypto.low24h)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Volume</span>
              <p className="font-medium text-foreground">{formatVolume(crypto.volume24h)}</p>
            </div>
          </div>
          
          {/* Trading Panel */}
          {expanded && (
            <div className="pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2">
              {/* Order Type */}
              <div className="flex gap-2">
                <Button
                  variant={orderType === 'market' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('market')}
                  className="flex-1"
                >
                  Mercado
                </Button>
                <Button
                  variant={orderType === 'limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType('limit')}
                  className="flex-1"
                >
                  Limite
                </Button>
              </div>
              
              {/* Limit Price Input */}
              {orderType === 'limit' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço Limite (USDT)</label>
                  <Input
                    type="number"
                    placeholder={crypto.price.toString()}
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}
              
              {/* Buy/Sell Tabs */}
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                    Comprar
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                    Vender
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="buy" className="space-y-3 mt-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantidade ({crypto.symbol})</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {quickAmounts.map((pct) => (
                      <Button
                        key={pct}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setBuyAmount((pct / 100 * 10).toFixed(4))}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium text-foreground">{formatPrice(calculateTotal(buyAmount))}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleBuy}
                  >
                    Comprar {crypto.symbol}
                  </Button>
                </TabsContent>
                
                <TabsContent value="sell" className="space-y-3 mt-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantidade ({crypto.symbol})</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {quickAmounts.map((pct) => (
                      <Button
                        key={pct}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setSellAmount((pct / 100 * 10).toFixed(4))}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium text-foreground">{formatPrice(calculateTotal(sellAmount))}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleSell}
                  >
                    Vender {crypto.symbol}
                  </Button>
                </TabsContent>
              </Tabs>
              
              {/* Trade on Bybit Link */}
              <Button 
                variant="outline"
                size="sm"
                className="w-full text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => window.open(`https://www.bybit.com/trade/spot/${crypto.symbol}/USDT`, '_blank')}
              >
                Negociar na Bybit →
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
