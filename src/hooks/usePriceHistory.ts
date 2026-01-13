import { useState, useEffect, useCallback } from 'react';

export interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

export interface OHLCPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Simulated price history generator
function generatePriceHistory(
  currentPrice: number,
  points: number,
  volatility: number = 0.02
): PricePoint[] {
  const history: PricePoint[] = [];
  let price = currentPrice * (1 - volatility * points * 0.1);
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000); // 1 minute intervals
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(price + change, 0.000001);
    
    history.push({
      time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      price: price,
      volume: Math.random() * 1000000,
    });
  }
  
  // Ensure last point matches current price
  if (history.length > 0) {
    history[history.length - 1].price = currentPrice;
  }
  
  return history;
}

function generateOHLCHistory(
  currentPrice: number,
  points: number,
  interval: '1h' | '4h' | '1d' = '1h',
  volatility: number = 0.03
): OHLCPoint[] {
  const history: OHLCPoint[] = [];
  let basePrice = currentPrice * (1 - volatility * points * 0.15);
  const now = new Date();
  
  const intervalMs = interval === '1h' ? 3600000 : interval === '4h' ? 14400000 : 86400000;
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs);
    
    const open = basePrice;
    const change = (Math.random() - 0.48) * volatility * basePrice; // Slight upward bias
    const close = Math.max(open + change, 0.000001);
    
    const highMultiplier = 1 + Math.random() * volatility * 0.5;
    const lowMultiplier = 1 - Math.random() * volatility * 0.5;
    
    const high = Math.max(open, close) * highMultiplier;
    const low = Math.min(open, close) * lowMultiplier;
    
    history.push({
      time: interval === '1d' 
        ? time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume: Math.random() * 10000000,
    });
    
    basePrice = close;
  }
  
  // Ensure last point matches current price
  if (history.length > 0) {
    history[history.length - 1].close = currentPrice;
  }
  
  return history;
}

export function usePriceHistory(symbol: string, currentPrice: number, interval: '1m' | '1h' | '4h' | '1d' = '1h') {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [ohlcHistory, setOhlcHistory] = useState<OHLCPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const generateHistory = useCallback(() => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const volatility = symbol.includes('BTC') ? 0.015 : 
                        symbol.includes('ETH') ? 0.02 : 
                        symbol.includes('DOGE') || symbol.includes('SHIB') ? 0.05 : 0.03;
      
      const points = interval === '1m' ? 60 : interval === '1h' ? 24 : interval === '4h' ? 42 : 30;
      
      setPriceHistory(generatePriceHistory(currentPrice, points, volatility));
      setOhlcHistory(generateOHLCHistory(currentPrice, points, interval === '1m' ? '1h' : interval, volatility));
      setLoading(false);
    }, 300);
  }, [symbol, currentPrice, interval]);

  useEffect(() => {
    generateHistory();
  }, [generateHistory]);

  return {
    priceHistory,
    ohlcHistory,
    loading,
    refresh: generateHistory,
  };
}
