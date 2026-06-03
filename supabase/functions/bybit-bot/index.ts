import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import ccxt from 'npm:ccxt';

// ---------- helpers ----------
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function getExchange() {
  const apiKey = Deno.env.get('BYBIT_API_KEY');
  const secret = Deno.env.get('BYBIT_SECRET_KEY');
  if (!apiKey || !secret) throw new Error('Bybit credentials not configured');
  return new ccxt.bybit({ apiKey, secret, enableRateLimit: true, options: { defaultType: 'unified' } });
}

function sinceFor(period: string): number | undefined {
  const now = Date.now();
  const map: Record<string, number> = {
    '24h': 24 * 3600e3,
    '7d': 7 * 86400e3,
    '30d': 30 * 86400e3,
    '90d': 90 * 86400e3,
    '1y': 365 * 86400e3,
  };
  return map[period] ? now - map[period] : undefined;
}

// Compute aggregate P&L from closed orders (sum of (sell - buy) per symbol pair is complex;
// we approximate using order "info.execValue" / "cost" deltas when available).
function computePnlFromOrders(orders: any[], sinceMs?: number) {
  const filtered = sinceMs ? orders.filter((o) => (o.timestamp ?? 0) >= sinceMs) : orders;
  let realized = 0;
  const bySymbol: Record<string, { buy: number; sell: number; count: number }> = {};
  for (const o of filtered) {
    if (o.status !== 'closed' && o.status !== 'filled') continue;
    const cost = Number(o.cost ?? (o.price ?? 0) * (o.filled ?? o.amount ?? 0)) || 0;
    const sym = o.symbol || 'UNKNOWN';
    bySymbol[sym] ??= { buy: 0, sell: 0, count: 0 };
    bySymbol[sym].count += 1;
    if (o.side === 'buy') bySymbol[sym].buy += cost;
    else if (o.side === 'sell') bySymbol[sym].sell += cost;
  }
  for (const s of Object.values(bySymbol)) realized += s.sell - s.buy;
  return { realized, bySymbol, totalTrades: filtered.length };
}

// ---------- main ----------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'dashboard';
    const exchange = getExchange();

    // ===== DASHBOARD: top metrics =====
    if (action === 'dashboard') {
      const balance = await exchange.fetchBalance();
      const usdt = balance.USDT || {};
      const totalUsdt = Number(usdt.total ?? 0);
      const freeUsdt = Number(usdt.free ?? 0);
      const usedUsdt = Number(usdt.used ?? 0);

      // Try positions (works only on derivatives; spot returns [])
      let positions: any[] = [];
      let unrealizedPnl = 0;
      try {
        positions = (await exchange.fetchPositions()) || [];
        positions = positions.filter((p) => Number(p.contracts || 0) > 0);
        unrealizedPnl = positions.reduce((s, p) => s + Number(p.unrealizedPnl || 0), 0);
      } catch (_e) {
        positions = [];
      }

      // Fetch up to 200 closed orders to compute period profits
      let allOrders: any[] = [];
      try {
        allOrders = await exchange.fetchClosedOrders(undefined, undefined, 200);
      } catch (_e) {
        allOrders = [];
      }

      const daily = computePnlFromOrders(allOrders, sinceFor('24h')).realized;
      const weekly = computePnlFromOrders(allOrders, sinceFor('7d')).realized;
      const monthly = computePnlFromOrders(allOrders, sinceFor('30d')).realized;
      const total = computePnlFromOrders(allOrders).realized;

      const investedCapital = positions.reduce(
        (s, p) => s + Number(p.initialMargin || p.notional || 0),
        0,
      );
      const roi = totalUsdt > 0 ? (total / totalUsdt) * 100 : 0;

      return json({
        success: true,
        data: {
          totalBalance: totalUsdt,
          availableBalance: freeUsdt,
          lockedBalance: usedUsdt,
          investedCapital,
          dailyProfit: daily,
          weeklyProfit: weekly,
          monthlyProfit: monthly,
          totalProfit: total,
          unrealizedPnl,
          roi,
          apiStatus: 'connected',
          botStatus: 'idle',
          openPositions: positions.length,
          lastSync: new Date().toISOString(),
        },
      });
    }

    // ===== POSITIONS =====
    if (action === 'positions') {
      let positions: any[] = [];
      try {
        positions = (await exchange.fetchPositions()) || [];
      } catch (_e) {}
      const mapped = positions
        .filter((p) => Number(p.contracts || 0) > 0)
        .map((p) => ({
          symbol: p.symbol,
          side: p.side,
          contracts: p.contracts,
          notional: p.notional,
          entryPrice: p.entryPrice,
          markPrice: p.markPrice,
          unrealizedPnl: p.unrealizedPnl,
          percentage: p.percentage,
          stopLoss: p.info?.stopLoss ?? null,
          takeProfit: p.info?.takeProfit ?? null,
          openedAt: p.timestamp ? new Date(p.timestamp).toISOString() : null,
        }));
      return json({ success: true, positions: mapped });
    }

    // ===== HISTORY =====
    if (action === 'history') {
      const period = body.period ?? '30d';
      const search = (body.search ?? '').toString().toUpperCase();
      const since = sinceFor(period);
      let orders = await exchange.fetchClosedOrders(undefined, since, 200);
      if (search) orders = orders.filter((o) => (o.symbol || '').toUpperCase().includes(search));

      const mapped = orders.map((o) => ({
        id: o.id,
        datetime: o.datetime,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        price: o.price,
        amount: o.amount,
        filled: o.filled,
        cost: o.cost,
        status: o.status,
        fee: o.fee?.cost ?? 0,
      }));
      return json({ success: true, orders: mapped });
    }

    // ===== STATS =====
    if (action === 'stats') {
      const orders = await exchange.fetchClosedOrders(undefined, undefined, 200);
      const { bySymbol, realized, totalTrades } = computePnlFromOrders(orders);
      const perSymbol = Object.entries(bySymbol).map(([sym, v]) => ({
        symbol: sym,
        pnl: v.sell - v.buy,
        count: v.count,
      }));
      const positives = perSymbol.filter((s) => s.pnl > 0);
      const negatives = perSymbol.filter((s) => s.pnl < 0);
      const winRate = perSymbol.length ? (positives.length / perSymbol.length) * 100 : 0;
      const best = perSymbol.reduce((a, b) => (a.pnl > b.pnl ? a : b), { pnl: -Infinity, symbol: '-', count: 0 });
      const worst = perSymbol.reduce((a, b) => (a.pnl < b.pnl ? a : b), { pnl: Infinity, symbol: '-', count: 0 });
      const avgProfit = perSymbol.length ? realized / perSymbol.length : 0;

      return json({
        success: true,
        stats: {
          totalTrades,
          winningTrades: positives.length,
          losingTrades: negatives.length,
          winRate,
          totalPnl: realized,
          avgProfit,
          bestTrade: best.pnl === -Infinity ? null : best,
          worstTrade: worst.pnl === Infinity ? null : worst,
          perSymbol,
        },
      });
    }

    // ===== STATUS (legacy compat) =====
    if (action === 'status') {
      // (kept below)
    }

    // ===== EQUITY CHART =====
    if (action === 'equity_chart') {
      const period = body.period ?? '30d';
      const since = sinceFor(period);
      const orders = await exchange.fetchClosedOrders(undefined, since, 200);
      // Build cumulative pnl over time (per symbol pair buy/sell offsets)
      const sorted = [...orders].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      const points: { time: number; equity: number }[] = [];
      let cum = 0;
      for (const o of sorted) {
        if (o.status !== 'closed' && o.status !== 'filled') continue;
        const cost = Number(o.cost ?? (o.price ?? 0) * (o.filled ?? o.amount ?? 0)) || 0;
        cum += o.side === 'sell' ? cost : -cost;
        points.push({ time: o.timestamp ?? Date.now(), equity: cum });
      }
      // BTC & ETH comparison series
      const tf = period === '24h' ? '1h' : period === '7d' ? '4h' : '1d';
      let btc: number[][] = [], eth: number[][] = [];
      try { btc = await exchange.fetchOHLCV('BTC/USDT', tf, since, 200); } catch (_) {}
      try { eth = await exchange.fetchOHLCV('ETH/USDT', tf, since, 200); } catch (_) {}
      const series = (arr: number[][]) => {
        if (!arr.length) return [];
        const base = arr[0][4];
        return arr.map((c) => ({ time: c[0], change: ((c[4] - base) / base) * 100 }));
      };
      return json({
        success: true,
        equity: points,
        btc: series(btc),
        eth: series(eth),
      });
    }

    if (action === 'status') {
      const balance = await exchange.fetchBalance();
      const usdtBalance = balance.USDT?.free || 0;
      const orders = await exchange.fetchClosedOrders(undefined, undefined, 10);
      return json({
        success: true,
        balance: usdtBalance,
        orders: orders.map((o) => ({
          id: o.id,
          symbol: o.symbol,
          side: o.side,
          amount: o.amount,
          price: o.price,
          status: o.status,
          datetime: o.datetime,
        })),
      });
    }

    // ===== ANALYZE & TRADE (simulation) =====
    if (action === 'analyze_and_trade') {
      const logs: string[] = [];
      logs.push('🔄 Iniciando análise de mercado na Bybit...');
      await exchange.loadMarkets();
      const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'];
      const balance = await exchange.fetchBalance();
      const usdtBalance = balance.USDT?.free || 0;
      logs.push(`💼 Saldo atual: ${usdtBalance} USDT`);
      let tradeExecuted = false;

      for (const symbol of symbols) {
        logs.push(`🟢 Mercado analisado: ${symbol}`);
        const market = exchange.market(symbol);
        if (!market?.active) {
          logs.push(`⚠️ Mercado ${symbol} inativo. Pulando.`);
          continue;
        }
        const ohlcv = await exchange.fetchOHLCV(symbol, '1h', undefined, 50);
        if (ohlcv.length < 20) {
          logs.push(`⚠️ Dados insuficientes para ${symbol}.`);
          continue;
        }
        const closes = ohlcv.map((c) => c[4] as number);
        const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const cur = closes[closes.length - 1];

        if (sma5 > sma20 && cur > sma5) {
          logs.push(`📈 Tendência de ALTA detectada em ${symbol} (SMA5 ${sma5.toFixed(2)} > SMA20 ${sma20.toFixed(2)}).`);
          const minCost = market.limits?.cost?.min || 5;
          if (usdtBalance < minCost) {
            logs.push(`⚠️ Saldo insuficiente (${usdtBalance} < ${minCost} USDT) para ${symbol}.`);
            continue;
          }
          logs.push(`💰 [SIMULAÇÃO] Compra executada em ${symbol} a ${cur}`);
          tradeExecuted = true;
          break;
        } else if (sma5 < sma20 && cur < sma5) {
          logs.push(`📉 Tendência de BAIXA em ${symbol}. Sem entrada de compra.`);
        } else {
          logs.push(`⚠️ Padrão NEUTRO em ${symbol}.`);
        }
      }
      if (!tradeExecuted) logs.push('🔄 Nenhuma oportunidade favorável encontrada neste ciclo.');
      return json({ success: true, logs });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (error: any) {
    console.error('Bot Error:', error);
    return json({ success: false, error: error.message ?? String(error) }, 500);
  }
});