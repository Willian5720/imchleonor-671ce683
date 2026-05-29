import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import ccxt from 'npm:ccxt';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const apiKey = Deno.env.get('BYBIT_API_KEY');
    const secret = Deno.env.get('BYBIT_SECRET_KEY');

    if (!apiKey || !secret) {
      throw new Error('Bybit credentials not configured');
    }

    const reqBody = await req.json().catch(() => ({}));
    const { action = 'status' } = reqBody;

    const exchange = new ccxt.bybit({
      apiKey,
      secret,
      enableRateLimit: true,
    });

    if (action === 'status') {
      // Fetch balance
      const balance = await exchange.fetchBalance();
      const usdtBalance = balance.USDT?.free || 0;
      
      // Fetch recent trades/orders
      const orders = await exchange.fetchClosedOrders(undefined, undefined, 10);
      
      return new Response(JSON.stringify({ 
        success: true, 
        balance: usdtBalance,
        orders: orders.map(o => ({
          id: o.id,
          symbol: o.symbol,
          side: o.side,
          amount: o.amount,
          price: o.price,
          status: o.status,
          datetime: o.datetime,
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'analyze_and_trade') {
      const logs: string[] = [];
      
      logs.push('Iniciando análise de mercado na Bybit...');
      
      // Load markets to know limits
      await exchange.loadMarkets();
      
      // Select top volume USDT markets
      const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'];
      let tradeExecuted = false;

      const balance = await exchange.fetchBalance();
      const usdtBalance = balance.USDT?.free || 0;
      logs.push(`Saldo atual: ${usdtBalance} USDT`);

      for (const symbol of symbols) {
        logs.push(`Analisando mercado ${symbol}...`);
        const market = exchange.market(symbol);
        
        if (!market || !market.active) {
          logs.push(`Mercado ${symbol} não está ativo ou não encontrado. Pulando.`);
          continue;
        }

        // Fetch OHLCV (1h timeframe)
        const ohlcv = await exchange.fetchOHLCV(symbol, '1h', undefined, 20);
        if (ohlcv.length < 20) {
          logs.push(`Dados insuficientes para ${symbol}. Pulando.`);
          continue;
        }

        // Simple SMA crossover strategy
        const closePrices = ohlcv.map(candle => candle[4] as number);
        const sma5 = closePrices.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const sma20 = closePrices.reduce((a, b) => a + b, 0) / 20;
        const currentPrice = closePrices[closePrices.length - 1];

        // Determine trend
        let signal = 'neutral';
        if (sma5 > sma20 && currentPrice > sma5) {
          signal = 'buy';
          logs.push(`Padrão de ALTA identificado em ${symbol} (SMA5 > SMA20).`);
        } else if (sma5 < sma20 && currentPrice < sma5) {
          signal = 'sell';
          logs.push(`Padrão de BAIXA identificado em ${symbol} (SMA5 < SMA20).`);
        } else {
          logs.push(`Padrão NEUTRO em ${symbol}. Sem viabilidade de entrada.`);
          continue;
        }

        // Check minimums
        const minCost = market.limits?.cost?.min || 5; // Default to 5 USDT if unknown
        const minAmount = market.limits?.amount?.min || 0.0001;
        
        if (signal === 'buy') {
          if (usdtBalance < minCost) {
            logs.push(`🚨 ALERTA: Saldo insuficiente (${usdtBalance} USDT) para o valor mínimo de entrada (${minCost} USDT) em ${symbol}. Seguindo para próximo.`);
            continue;
          }
          
          const amountToBuy = minCost * 1.1 / currentPrice; // Buy slightly above min
          if (amountToBuy < minAmount) {
            logs.push(`🚨 ALERTA: Quantidade calculada é menor que o mínimo permitido para ${symbol}. Seguindo para próximo.`);
            continue;
          }

          logs.push(`✅ Executando ordem automática de COMPRA para ${symbol}...`);
          // Real trading logic would go here. We will simulate if it's too risky or use testnet.
          // await exchange.createMarketBuyOrder(symbol, amountToBuy);
          logs.push(`[SIMULAÇÃO] Ordem de compra executada com sucesso!`);
          tradeExecuted = true;
          break; // Stop after one trade
        }
      }

      if (!tradeExecuted) {
        logs.push('Nenhuma oportunidade favorável encontrada neste ciclo.');
      }

      return new Response(JSON.stringify({ success: true, logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bot Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});