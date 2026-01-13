import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface PriceChartProps {
  crypto: CryptoPrice;
}

type ChartType = 'line' | 'area' | 'candle';
type TimeInterval = '1h' | '4h' | '1d';

export function PriceChart({ crypto }: PriceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [interval, setInterval] = useState<TimeInterval>('1h');
  
  const { priceHistory, ohlcHistory, loading, refresh } = usePriceHistory(
    crypto.symbol,
    crypto.price,
    interval
  );

  const isPositive = crypto.change24h >= 0;
  const chartColor = isPositive ? 'hsl(150, 100%, 50%)' : 'hsl(0, 84%, 60%)';

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        {chartType === 'candle' ? (
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Abertura:</span>
              <span className="text-foreground font-medium">{formatPrice(data.open)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Máxima:</span>
              <span className="text-green-500 font-medium">{formatPrice(data.high)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mínima:</span>
              <span className="text-red-500 font-medium">{formatPrice(data.low)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fechamento:</span>
              <span className="text-foreground font-medium">{formatPrice(data.close)}</span>
            </p>
          </div>
        ) : (
          <p className="text-foreground font-medium">{formatPrice(data.price)}</p>
        )}
      </div>
    );
  };

  const CandlestickBar = (props: any) => {
    const { x, y, width, height, open, close, high, low } = props;
    const isUp = close >= open;
    const color = isUp ? 'hsl(150, 100%, 50%)' : 'hsl(0, 84%, 60%)';
    
    const bodyTop = Math.min(open, close);
    const bodyHeight = Math.abs(close - open);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.1}
          y={y + (height * (high - Math.max(open, close))) / (high - low)}
          width={width * 0.8}
          height={Math.max((height * bodyHeight) / (high - low), 2)}
          fill={isUp ? color : color}
          fillOpacity={isUp ? 0.8 : 1}
          stroke={color}
        />
      </g>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {crypto.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {crypto.name}
                <span className="text-muted-foreground font-normal text-sm">
                  {crypto.symbol}/USDT
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ${crypto.price >= 1 ? crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : crypto.price.toFixed(6)}
                </span>
                <Badge 
                  className={`flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type */}
            <div className="flex gap-1 p-1 rounded-lg bg-background/50">
              {(['area', 'line', 'candle'] as ChartType[]).map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setChartType(type)}
                >
                  {type === 'candle' ? (
                    <BarChart3 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs capitalize">{type === 'area' ? 'Área' : 'Linha'}</span>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Time Interval */}
            <div className="flex gap-1 p-1 rounded-lg bg-background/50">
              {(['1h', '4h', '1d'] as TimeInterval[]).map((int) => (
                <Button
                  key={int}
                  variant={interval === int ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setInterval(int)}
                >
                  {int}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'candle' ? (
                <ComposedChart data={ohlcHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={formatPrice}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="high"
                    fill="transparent"
                    shape={(props: any) => {
                      const data = ohlcHistory[props.index];
                      if (!data) return null;
                      return (
                        <CandlestickBar
                          {...props}
                          open={data.open}
                          close={data.close}
                          high={data.high}
                          low={data.low}
                        />
                      );
                    }}
                  />
                </ComposedChart>
              ) : chartType === 'area' ? (
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id={`gradient-${crypto.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={formatPrice}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#gradient-${crypto.symbol})`}
                  />
                </AreaChart>
              ) : (
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={formatPrice}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: chartColor }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Price Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 p-3 rounded-lg bg-background/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h High</p>
            <p className="text-sm font-medium text-green-500">
              {formatPrice(crypto.high24h)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h Low</p>
            <p className="text-sm font-medium text-red-500">
              {formatPrice(crypto.low24h)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Volume 24h</p>
            <p className="text-sm font-medium text-foreground">
              {crypto.volume24h >= 1e9 
                ? `$${(crypto.volume24h / 1e9).toFixed(2)}B`
                : `$${(crypto.volume24h / 1e6).toFixed(2)}M`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Variação</p>
            <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
