import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://lovable.dev',
];

// Match lovable.app and lovableproject.com subdomains
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any subdomain of lovable.app or lovableproject.com
  if (/^https:\/\/[a-zA-Z0-9-]+\.lovable\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9-]+\.lovableproject\.com$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Simple in-memory rate limiting (per IP, 60 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// Simple response cache (5 second TTL)
let cachedAllPrices: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

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
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting by IP
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
    }), { 
      status: 429, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, symbol } = body;

    console.log("Crypto prices request:", { action, symbol, ip: clientIP });

    if (action === 'get_single' && symbol) {
      // Validate symbol format (alphanumeric only, max 10 chars)
      if (typeof symbol !== 'string' || !/^[A-Za-z0-9]{1,10}$/.test(symbol)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid symbol format',
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Fetch single crypto price
      const response = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol.toUpperCase()}USDT`
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
      const symbolKey = `${symbol.toUpperCase()}USDT`;
      const meta = cryptoNames[symbolKey] || { name: symbol.toUpperCase(), icon: '🪙' };

      const cryptoPrice: CryptoPrice = {
        symbol: symbol.toUpperCase(),
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

    // Check cache for all prices
    const now = Date.now();
    if (cachedAllPrices && (now - cachedAllPrices.timestamp) < CACHE_TTL_MS) {
      return new Response(JSON.stringify({
        success: true,
        data: cachedAllPrices.data,
        timestamp: cachedAllPrices.timestamp,
        cached: true,
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

    // Update cache
    cachedAllPrices = { data: prices, timestamp: now };

    return new Response(JSON.stringify({
      success: true,
      data: prices,
      timestamp: now,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Crypto prices error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred while fetching prices',
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
