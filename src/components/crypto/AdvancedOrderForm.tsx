import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdvancedOrderFormProps {
  crypto: CryptoPrice;
}

type OrderType = 'market' | 'limit' | 'stop-limit';

export function AdvancedOrderForm({ crypto }: AdvancedOrderFormProps) {
  const { toast } = useToast();
  const { addOrder } = useTradingHistory();
  
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [sliderValue, setSliderValue] = useState([0]);
  const [usePostOnly, setUsePostOnly] = useState(false);
  const [useReduceOnly, setUseReduceOnly] = useState(false);

  const balance = 10000; // Simulated USDT balance
  const holdings = 0.5; // Simulated crypto holdings

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const getOrderPrice = () => {
    if (orderType === 'market') return crypto.price;
    return parseFloat(limitPrice) || crypto.price;
  };

  const calculateTotal = () => {
    const qty = parseFloat(amount) || 0;
    return qty * getOrderPrice();
  };

  const getMaxAmount = () => {
    if (side === 'buy') {
      return balance / getOrderPrice();
    }
    return holdings;
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    const maxAmount = getMaxAmount();
    setAmount((maxAmount * percentage).toFixed(6));
  };

  const handleSubmit = () => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }

    if (orderType !== 'market' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast({
        title: "Preço limite inválido",
        description: "Por favor, insira um preço limite válido.",
        variant: "destructive"
      });
      return;
    }

    if (orderType === 'stop-limit' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      toast({
        title: "Preço de stop inválido",
        description: "Por favor, insira um preço de stop válido.",
        variant: "destructive"
      });
      return;
    }

    const order = addOrder({
      symbol: crypto.symbol,
      name: crypto.name,
      type: side,
      orderType,
      amount: qty,
      price: getOrderPrice(),
      total: calculateTotal(),
      limitPrice: orderType !== 'market' ? parseFloat(limitPrice) : undefined,
      stopPrice: orderType === 'stop-limit' ? parseFloat(stopPrice) : undefined,
    });

    toast({
      title: order.status === 'filled' ? "Ordem Executada" : "Ordem Criada",
      description: `${side === 'buy' ? 'Compra' : 'Venda'} de ${qty.toFixed(6)} ${crypto.symbol} ${
        orderType === 'market' 
          ? `a mercado por ${formatPrice(calculateTotal())}`
          : `com limite em ${formatPrice(parseFloat(limitPrice))}`
      }`,
    });

    // Reset form
    setAmount('');
    setLimitPrice('');
    setStopPrice('');
    setSliderValue([0]);
  };

  const isPositive = crypto.change24h >= 0;

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {crypto.icon}
            </div>
            {crypto.symbol}/USDT
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{formatPrice(crypto.price)}</span>
            <Badge 
              className={`flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Type Selection */}
        <div className="flex gap-2 p-1 rounded-lg bg-background/50">
          {(['market', 'limit', 'stop-limit'] as OrderType[]).map((type) => (
            <Button
              key={type}
              variant={orderType === type ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setOrderType(type)}
            >
              {type === 'market' ? 'Mercado' : type === 'limit' ? 'Limite' : 'Stop-Limit'}
            </Button>
          ))}
        </div>

        {/* Buy/Sell Tabs */}
        <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="buy" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Comprar
            </TabsTrigger>
            <TabsTrigger 
              value="sell" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              Vender
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Stop Price (for stop-limit orders) */}
            {orderType === 'stop-limit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Preço de Stop</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Quando o preço atingir este valor, a ordem limite será ativada.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  placeholder={crypto.price.toString()}
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            )}

            {/* Limit Price */}
            {orderType !== 'market' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Preço Limite (USDT)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setLimitPrice(crypto.price.toString())}
                  >
                    Mercado
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder={crypto.price.toString()}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-background/50"
                />
                {limitPrice && (
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(limitPrice) > crypto.price 
                      ? `${((parseFloat(limitPrice) / crypto.price - 1) * 100).toFixed(2)}% acima do mercado`
                      : `${((1 - parseFloat(limitPrice) / crypto.price) * 100).toFixed(2)}% abaixo do mercado`}
                  </p>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Quantidade ({crypto.symbol})</Label>
                <span className="text-xs text-muted-foreground">
                  Disponível: {side === 'buy' 
                    ? `${formatPrice(balance)} USDT`
                    : `${holdings.toFixed(6)} ${crypto.symbol}`}
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const pct = (parseFloat(e.target.value) / getMaxAmount()) * 100;
                  setSliderValue([Math.min(Math.max(pct, 0), 100)]);
                }}
                className="bg-background/50"
              />
            </div>

            {/* Percentage Slider */}
            <div className="space-y-3">
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleSliderChange([pct])}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Order Options (for limit/stop-limit) */}
            {orderType !== 'market' && (
              <div className="space-y-3 p-3 rounded-lg bg-background/30 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Post Only</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            A ordem será adicionada ao livro de ofertas apenas se não for executada imediatamente.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={usePostOnly} onCheckedChange={setUsePostOnly} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Reduce Only</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            A ordem só pode reduzir uma posição existente, não abrir uma nova.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={useReduceOnly} onCheckedChange={setUseReduceOnly} />
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="p-3 rounded-lg bg-background/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-medium">
                  {orderType === 'market' ? 'Mercado' : formatPrice(parseFloat(limitPrice) || crypto.price)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantidade</span>
                <span className="font-medium">{parseFloat(amount) || 0} {crypto.symbol}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border/30 pt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">{formatPrice(calculateTotal())}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              className={`w-full ${side === 'buy' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={handleSubmit}
            >
              {side === 'buy' ? 'Comprar' : 'Vender'} {crypto.symbol}
            </Button>

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
        </Tabs>
      </CardContent>
    </Card>
  );
}
