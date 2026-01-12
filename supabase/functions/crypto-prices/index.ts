import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Popular crypto symbols to fetch
const CRYPTO_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'LINKUSDT',
];

interface BybitTickerResult {
  symbol: string;
  lastPrice: string;
  highPrice24h: string;
  lowPrice24h: string;
  prevPrice24h: string;
  volume24h: string;
  turnover24h: string;
  price24hPcnt: string;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  icon: string;
}

const cryptoNames: Record<string, { name: string; icon: string }> = {
  BTCUSDT: { name: 'Bitcoin', icon: '₿' },
  ETHUSDT: { name: 'Ethereum', icon: 'Ξ' },
  SOLUSDT: { name: 'Solana', icon: '◎' },
  XRPUSDT: { name: 'XRP', icon: '✕' },
  DOGEUSDT: { name: 'Dogecoin', icon: 'Ð' },
  ADAUSDT: { name: 'Cardano', icon: '₳' },
  AVAXUSDT: { name: 'Avalanche', icon: '🔺' },
  DOTUSDT: { name: 'Polkadot', icon: '●' },
  MATICUSDT: { name: 'Polygon', icon: '⬡' },
  LINKUSDT: { name: 'Chainlink', icon: '⬡' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, symbol } = body;

    console.log("Crypto prices request:", { action, symbol });

    if (action === 'get_single' && symbol) {
      // Fetch single crypto price
      const response = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}USDT`
      );
      
      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result?.list?.[0]) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Symbol not found',
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const ticker = data.result.list[0] as BybitTickerResult;
      const symbolKey = `${symbol}USDT`;
      const meta = cryptoNames[symbolKey] || { name: symbol, icon: '🪙' };

      const cryptoPrice: CryptoPrice = {
        symbol: symbol,
        name: meta.name,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.price24hPcnt) * 100,
        high24h: parseFloat(ticker.highPrice24h),
        low24h: parseFloat(ticker.lowPrice24h),
        volume24h: parseFloat(ticker.turnover24h),
        icon: meta.icon,
      };

      return new Response(JSON.stringify({
        success: true,
        data: cryptoPrice,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch all crypto prices
    const response = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=spot`
    );
    
    const data = await response.json();
    
    if (data.retCode !== 0) {
      throw new Error(data.retMsg || 'Failed to fetch prices');
    }

    const allTickers = data.result?.list as BybitTickerResult[] || [];
    
    // Filter to only the symbols we want
    const filteredTickers = allTickers.filter(t => CRYPTO_SYMBOLS.includes(t.symbol));
    
    const prices: CryptoPrice[] = filteredTickers.map(ticker => {
      const meta = cryptoNames[ticker.symbol] || { name: ticker.symbol.replace('USDT', ''), icon: '🪙' };
      return {
        symbol: ticker.symbol.replace('USDT', ''),
        name: meta.name,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.price24hPcnt) * 100,
        high24h: parseFloat(ticker.highPrice24h),
        low24h: parseFloat(ticker.lowPrice24h),
        volume24h: parseFloat(ticker.turnover24h),
        icon: meta.icon,
      };
    });

    // Sort by volume (most traded first)
    prices.sort((a, b) => b.volume24h - a.volume24h);

    return new Response(JSON.stringify({
      success: true,
      data: prices,
      timestamp: Date.now(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Crypto prices error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
