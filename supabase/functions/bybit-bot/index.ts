import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import ccxt from 'npm:ccxt';

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function getExchange() {
  const apiKey = Deno.env.get('BYBIT_API_KEY');
  const secret = Deno.env.get('BYBIT_SECRET_KEY');
  if (!apiKey || !secret) throw new Error('Bybit credentials not configured');
  return new ccxt.bybit({ apiKey, secret, enableRateLimit: true, options: { defaultType: 'unified' } });
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data } = await userClient.auth.getUser();
  return data.user?.id ?? null;
}

async function logBot(userId: string | null, type: string, emoji: string, message: string, details: any = {}) {
  try {
    await admin.from('bot_logs').insert({ user_id: userId, type, emoji, message, details });
  } catch (_) {}
}

async function logAnalysis(userId: string | null, row: {
  symbol: string; signal: string; price?: number; estimated_value?: number;
  estimated_amount?: number; reasons?: string[]; executed?: boolean;
  rejection_reason?: string | null; order_id?: string | null; timeframe?: string;
}) {
  if (!userId) return;
  try {
    await admin.from('bot_analyses').insert({
      user_id: userId,
      symbol: row.symbol,
      signal: row.signal,
      price: row.price ?? null,
      estimated_value: row.estimated_value ?? null,
      estimated_amount: row.estimated_amount ?? null,
      reasons: row.reasons ?? [],
      executed: !!row.executed,
      rejection_reason: row.rejection_reason ?? null,
      order_id: row.order_id ?? null,
      timeframe: row.timeframe ?? null,
    });
  } catch (_) {}
}

async function notify(userId: string, title: string, body: string, severity = 'info') {
  try {
    await admin.from('bot_notifications').insert({ user_id: userId, title, body, severity });
  } catch (_) {}
}

function sinceFor(p: string): number | undefined {
  const m: Record<string, number> = { '24h': 864e5, '7d': 6048e5, '30d': 2592e6, '90d': 7776e6, '1y': 31536e6 };
  return m[p] ? Date.now() - m[p] : undefined;
}

function computePnlFromOrders(orders: any[], sinceMs?: number) {
  const f = sinceMs ? orders.filter((o) => (o.timestamp ?? 0) >= sinceMs) : orders;
  let realized = 0;
  const bySym: Record<string, { buy: number; sell: number; count: number }> = {};
  for (const o of f) {
    if (o.status !== 'closed' && o.status !== 'filled') continue;
    const cost = Number(o.cost ?? (o.price ?? 0) * (o.filled ?? o.amount ?? 0)) || 0;
    const s = o.symbol || 'UNKNOWN';
    bySym[s] ??= { buy: 0, sell: 0, count: 0 };
    bySym[s].count++;
    if (o.side === 'buy') bySym[s].buy += cost;
    else if (o.side === 'sell') bySym[s].sell += cost;
  }
  for (const v of Object.values(bySym)) realized += v.sell - v.buy;
  return { realized, bySymbol: bySym, totalTrades: f.length };
}

// ============ Indicators ============
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}
function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const avgG = gains / period, avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}
function macd(values: number[]) {
  const e12 = ema(values, 12);
  const e26 = ema(values, 26);
  const line = e12.map((v, i) => v - e26[i]);
  const signal = ema(line, 9);
  const last = line.length - 1;
  return { macd: line[last], signal: signal[last], hist: line[last] - signal[last] };
}
function bollinger(values: number[], period = 20, mult = 2) {
  const slice = values.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
  const std = Math.sqrt(variance);
  return { upper: mean + mult * std, lower: mean - mult * std, mid: mean };
}

// ============ Signal engine ============
function generateSignal(closes: number[], settings: any): { signal: 'buy' | 'sell' | 'hold'; reasons: string[] } {
  const reasons: string[] = [];
  let bull = 0, bear = 0;
  const price = closes[closes.length - 1];

  if (settings.use_rsi) {
    const r = rsi(closes);
    if (r < 30) { bull++; reasons.push(`RSI ${r.toFixed(1)} oversold`); }
    else if (r > 70) { bear++; reasons.push(`RSI ${r.toFixed(1)} overbought`); }
    else reasons.push(`RSI ${r.toFixed(1)} neutral`);
  }
  if (settings.use_macd) {
    const m = macd(closes);
    if (m.hist > 0 && m.macd > m.signal) { bull++; reasons.push(`MACD bullish ${m.hist.toFixed(2)}`); }
    else if (m.hist < 0 && m.macd < m.signal) { bear++; reasons.push(`MACD bearish ${m.hist.toFixed(2)}`); }
  }
  if (settings.use_ema) {
    const e9 = ema(closes, 9), e21 = ema(closes, 21);
    const a = e9[e9.length - 1], b = e21[e21.length - 1];
    if (a > b && price > a) { bull++; reasons.push(`EMA9>EMA21 uptrend`); }
    else if (a < b && price < a) { bear++; reasons.push(`EMA9<EMA21 downtrend`); }
  }
  if (settings.use_bollinger) {
    const bb = bollinger(closes);
    if (price <= bb.lower) { bull++; reasons.push(`Price at lower BB`); }
    else if (price >= bb.upper) { bear++; reasons.push(`Price at upper BB`); }
  }

  const signal = bull >= 2 && bull > bear ? 'buy' : bear >= 2 && bear > bull ? 'sell' : 'hold';
  return { signal, reasons };
}

const DEFAULTS = {
  enabled: false, max_order_usdt: 10, max_pct_balance: 5, stop_loss_pct: 2, take_profit_pct: 4,
  daily_loss_limit: 50, weekly_loss_limit: 200,
  assets: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], timeframe: '1h',
  use_rsi: true, use_macd: true, use_ema: true, use_bollinger: true,
};

async function getSettings(userId: string) {
  const { data } = await admin.from('bot_settings').select('*').eq('user_id', userId).maybeSingle();
  return data ?? { ...DEFAULTS, user_id: userId };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'dashboard';
    const userId = await getUserId(req);
    // Require authentication for ALL actions — financial/portfolio data must never be public
    if (!userId) return json({ error: 'auth required' }, 401);
    // Require admin: the bot uses platform-wide Bybit credentials, so only admins can access it
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (roleErr || !isAdmin) return json({ error: 'forbidden: admin only' }, 403);
    const exchange = getExchange();

    if (action === 'dashboard') {
      const balance = await exchange.fetchBalance();
      const usdt = balance.USDT || {};
      const totalUsdt = Number(usdt.total ?? 0);
      const freeUsdt = Number(usdt.free ?? 0);
      const usedUsdt = Number(usdt.used ?? 0);
      let positions: any[] = [], unrealizedPnl = 0;
      try {
        positions = ((await exchange.fetchPositions()) || []).filter((p: any) => Number(p.contracts || 0) > 0);
        unrealizedPnl = positions.reduce((s, p) => s + Number(p.unrealizedPnl || 0), 0);
      } catch (_) {}
      let allOrders: any[] = [];
      try { allOrders = await exchange.fetchClosedOrders(undefined, undefined, 200); } catch (_) {}
      const daily = computePnlFromOrders(allOrders, sinceFor('24h')).realized;
      const weekly = computePnlFromOrders(allOrders, sinceFor('7d')).realized;
      const monthly = computePnlFromOrders(allOrders, sinceFor('30d')).realized;
      const total = computePnlFromOrders(allOrders).realized;
      const investedCapital = positions.reduce((s, p) => s + Number(p.initialMargin || p.notional || 0), 0);
      const roi = totalUsdt > 0 ? (total / totalUsdt) * 100 : 0;
      // === Extra balances: Funding & Earn ===
      let fundingUsdt = 0, earnUsdt = 0;
      const earnPositions: any[] = [];
      try {
        const r: any = await (exchange as any).privateGetV5AssetTransferQueryAccountCoinsBalance({
          accountType: 'FUND', coin: 'USDT',
        });
        const row = r?.result?.balance?.[0] ?? r?.result?.list?.[0];
        fundingUsdt = Number(row?.walletBalance ?? row?.transferBalance ?? 0);
      } catch (_) {}
      try {
        const r: any = await (exchange as any).privateGetV5EarnPosition({ category: 'FlexibleSaving' });
        for (const p of r?.result?.list ?? []) {
          earnPositions.push({ coin: p.coin, amount: Number(p.amount ?? 0), category: p.category, productId: p.productId });
          if (p.coin === 'USDT') earnUsdt += Number(p.amount ?? 0);
        }
      } catch (_) {}
      return json({
        success: true,
        data: {
          totalBalance: totalUsdt, availableBalance: freeUsdt, lockedBalance: usedUsdt, investedCapital,
          dailyProfit: daily, weeklyProfit: weekly, monthlyProfit: monthly, totalProfit: total,
          unrealizedPnl, roi, apiStatus: 'connected', botStatus: 'idle',
          openPositions: positions.length, lastSync: new Date().toISOString(),
          fundingBalance: fundingUsdt, earnBalance: earnUsdt, earnPositions,
          combinedBalance: totalUsdt + fundingUsdt + earnUsdt,
        },
      });
    }

    // ===== Internal transfer Funding -> Unified (or any direction) =====
    if (action === 'transfer_internal') {
      if (!userId) return json({ error: 'auth required' }, 401);
      const amount = Number(body.amount);
      const coin = (body.coin ?? 'USDT').toString().toUpperCase();
      const from = (body.from ?? 'FUND').toString().toUpperCase(); // FUND | UNIFIED
      const to = (body.to ?? 'UNIFIED').toString().toUpperCase();
      if (!amount || amount <= 0) return json({ success: false, error: 'amount inválido' }, 400);
      try {
        const transferId = crypto.randomUUID();
        const r: any = await (exchange as any).privatePostV5AssetTransferInterTransfer({
          transferId, coin, amount: String(amount), fromAccountType: from, toAccountType: to,
        });
        await logBot(userId, 'transfer', '🔁', `Transferência ${from}→${to} ${amount} ${coin}`, r?.result ?? {});
        await notify(userId, 'Transferência concluída', `${amount} ${coin} ${from}→${to}`, 'success');
        return json({ success: true, result: r?.result });
      } catch (e: any) {
        await logBot(userId, 'error', '❌', `Falha transferência: ${e.message}`, {});
        return json({ success: false, error: e.message }, 500);
      }
    }

    if (action === 'positions') {
      let positions: any[] = [];
      try { positions = (await exchange.fetchPositions()) || []; } catch (_) {}
      return json({
        success: true,
        positions: positions.filter((p) => Number(p.contracts || 0) > 0).map((p: any) => ({
          symbol: p.symbol, side: p.side, contracts: p.contracts, notional: p.notional,
          entryPrice: p.entryPrice, markPrice: p.markPrice, unrealizedPnl: p.unrealizedPnl,
          percentage: p.percentage, stopLoss: p.info?.stopLoss ?? null, takeProfit: p.info?.takeProfit ?? null,
          openedAt: p.timestamp ? new Date(p.timestamp).toISOString() : null,
        })),
      });
    }

    if (action === 'history') {
      const period = body.period ?? '30d';
      const search = (body.search ?? '').toString().toUpperCase();
      const since = sinceFor(period);
      let orders = await exchange.fetchClosedOrders(undefined, since, 200);
      if (search) orders = orders.filter((o: any) => (o.symbol || '').toUpperCase().includes(search));
      return json({
        success: true,
        orders: orders.map((o: any) => ({
          id: o.id, datetime: o.datetime, symbol: o.symbol, side: o.side, type: o.type,
          price: o.price, amount: o.amount, filled: o.filled, cost: o.cost, status: o.status, fee: o.fee?.cost ?? 0,
        })),
      });
    }

    if (action === 'stats') {
      const orders = await exchange.fetchClosedOrders(undefined, undefined, 200);
      const { bySymbol, realized, totalTrades } = computePnlFromOrders(orders);
      const perSymbol = Object.entries(bySymbol).map(([s, v]: any) => ({ symbol: s, pnl: v.sell - v.buy, count: v.count }));
      const pos = perSymbol.filter((s) => s.pnl > 0), neg = perSymbol.filter((s) => s.pnl < 0);
      const winRate = perSymbol.length ? (pos.length / perSymbol.length) * 100 : 0;
      const best = perSymbol.reduce((a, b) => (a.pnl > b.pnl ? a : b), { pnl: -Infinity, symbol: '-', count: 0 });
      const worst = perSymbol.reduce((a, b) => (a.pnl < b.pnl ? a : b), { pnl: Infinity, symbol: '-', count: 0 });
      return json({
        success: true,
        stats: {
          totalTrades, winningTrades: pos.length, losingTrades: neg.length, winRate,
          totalPnl: realized, avgProfit: perSymbol.length ? realized / perSymbol.length : 0,
          bestTrade: best.pnl === -Infinity ? null : best,
          worstTrade: worst.pnl === Infinity ? null : worst, perSymbol,
        },
      });
    }

    if (action === 'equity_chart') {
      const period = body.period ?? '30d';
      const since = sinceFor(period);
      const orders = await exchange.fetchClosedOrders(undefined, since, 200);
      const sorted = [...orders].sort((a: any, b: any) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      const points: { time: number; equity: number }[] = [];
      let cum = 0;
      for (const o of sorted) {
        if (o.status !== 'closed' && o.status !== 'filled') continue;
        const cost = Number(o.cost ?? (o.price ?? 0) * (o.filled ?? o.amount ?? 0)) || 0;
        cum += o.side === 'sell' ? cost : -cost;
        points.push({ time: o.timestamp ?? Date.now(), equity: cum });
      }
      const tf = period === '24h' ? '1h' : period === '7d' ? '4h' : '1d';
      let btc: number[][] = [], eth: number[][] = [];
      try { btc = await exchange.fetchOHLCV('BTC/USDT', tf, since, 200); } catch (_) {}
      try { eth = await exchange.fetchOHLCV('ETH/USDT', tf, since, 200); } catch (_) {}
      const series = (arr: number[][]) => !arr.length ? [] : arr.map((c) => ({ time: c[0], change: ((c[4] - arr[0][4]) / arr[0][4]) * 100 }));
      return json({ success: true, equity: points, btc: series(btc), eth: series(eth) });
    }

    // ===== SETTINGS =====
    if (action === 'get_settings') {
      if (!userId) return json({ error: 'auth required' }, 401);
      return json({ success: true, settings: await getSettings(userId) });
    }
    if (action === 'save_settings') {
      if (!userId) return json({ error: 'auth required' }, 401);
      const s = { ...DEFAULTS, ...body.settings, user_id: userId, updated_at: new Date().toISOString() };
      const { error } = await admin.from('bot_settings').upsert(s, { onConflict: 'user_id' });
      if (error) return json({ success: false, error: error.message }, 500);
      await logBot(userId, 'settings', '⚙️', 'Configurações atualizadas', s);
      return json({ success: true });
    }

    if (action === 'get_logs') {
      if (!userId) return json({ error: 'auth required' }, 401);
      const { data } = await admin.from('bot_logs')
        .select('*').or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false }).limit(200);
      return json({ success: true, logs: data ?? [] });
    }

    if (action === 'get_analyses') {
      if (!userId) return json({ error: 'auth required' }, 401);
      const period = (body.period ?? '7d').toString();
      const search = (body.search ?? '').toString().toUpperCase();
      const filter = (body.filter ?? 'all').toString(); // all|executed|rejected|buy|sell|hold
      const since = sinceFor(period);
      let q = admin.from('bot_analyses').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(500);
      if (since) q = q.gte('created_at', new Date(since).toISOString());
      const { data } = await q;
      let rows = data ?? [];
      if (search) rows = rows.filter((r: any) => (r.symbol || '').toUpperCase().includes(search));
      if (filter === 'executed') rows = rows.filter((r: any) => r.executed);
      else if (filter === 'rejected') rows = rows.filter((r: any) => !r.executed && r.signal === 'buy');
      else if (['buy', 'sell', 'hold'].includes(filter)) rows = rows.filter((r: any) => r.signal === filter);
      return json({ success: true, analyses: rows });
    }

    // ===== ANALYZE & TRADE — LIVE =====
    if (action === 'analyze_and_trade') {
      if (!userId) return json({ error: 'auth required' }, 401);
      const settings = await getSettings(userId);
      const logs: string[] = [];
      const push = async (emoji: string, msg: string, type = 'market', details: any = {}) => {
        logs.push(`${emoji} ${msg}`);
        await logBot(userId, type, emoji, msg, details);
      };

      await push('🔄', 'Iniciando ciclo de análise LIVE...');

      // Risk: check daily/weekly loss limits from closed orders
      const recent = await exchange.fetchClosedOrders(undefined, sinceFor('7d'), 200);
      const dailyPnl = computePnlFromOrders(recent, sinceFor('24h')).realized;
      const weeklyPnl = computePnlFromOrders(recent, sinceFor('7d')).realized;
      if (-dailyPnl >= Number(settings.daily_loss_limit)) {
        await push('🛑', `Limite diário de perda atingido (${dailyPnl.toFixed(2)} USDT). Bot bloqueado.`, 'risk');
        await notify(userId, 'Bot bloqueado', `Perda diária ${dailyPnl.toFixed(2)} USDT excede limite.`, 'warning');
        return json({ success: true, logs, blocked: true });
      }
      if (-weeklyPnl >= Number(settings.weekly_loss_limit)) {
        await push('🛑', `Limite semanal de perda atingido (${weeklyPnl.toFixed(2)} USDT). Bot bloqueado.`, 'risk');
        await notify(userId, 'Bot bloqueado', `Perda semanal ${weeklyPnl.toFixed(2)} USDT excede limite.`, 'warning');
        return json({ success: true, logs, blocked: true });
      }

      await exchange.loadMarkets();
      const balance = await exchange.fetchBalance();
      const usdtFree = Number(balance.USDT?.free ?? 0);
      await push('💼', `Saldo disponível: ${usdtFree.toFixed(2)} USDT`);

      const orderBudget = Math.min(Number(settings.max_order_usdt), usdtFree * (Number(settings.max_pct_balance) / 100));
      if (orderBudget < 1) {
        await push('⚠️', `Orçamento por ordem muito baixo (${orderBudget.toFixed(2)} USDT). Pulando.`, 'risk');
        return json({ success: true, logs });
      }

      let executed = false;
      for (const symbol of settings.assets as string[]) {
        try {
          const market = exchange.market(symbol);
          if (!market?.active) {
            await push('⚠️', `${symbol} inativo`);
            await logAnalysis(userId, { symbol, signal: 'hold', timeframe: settings.timeframe, rejection_reason: 'Mercado inativo' });
            continue;
          }
          const ohlcv = await exchange.fetchOHLCV(symbol, settings.timeframe, undefined, 100);
          if (ohlcv.length < 30) {
            await push('⚠️', `Dados insuficientes para ${symbol}`);
            await logAnalysis(userId, { symbol, signal: 'hold', timeframe: settings.timeframe, rejection_reason: 'Dados insuficientes' });
            continue;
          }
          const closes = ohlcv.map((c: any) => c[4] as number);
          const price = closes[closes.length - 1];
          const { signal, reasons } = generateSignal(closes, settings);
          await push(signal === 'buy' ? '📈' : signal === 'sell' ? '📉' : '➖',
            `${symbol} @ ${price} → ${signal.toUpperCase()} | ${reasons.join(', ')}`, 'signal');

          if (signal === 'buy') {
            const minCost = market.limits?.cost?.min || 5;
            if (orderBudget < minCost) {
              const reason = `Orçamento ${orderBudget.toFixed(2)} USDT abaixo do mínimo ${minCost}`;
              await push('⚠️', `${symbol}: ${reason}`);
              await logAnalysis(userId, { symbol, signal, price, reasons, timeframe: settings.timeframe, estimated_value: orderBudget, rejection_reason: reason });
              continue;
            }
            const amount = Number((orderBudget / price).toFixed(market.precision?.amount ?? 6));

            // anti-duplicação
            const open = await exchange.fetchOpenOrders(symbol).catch(() => []);
            if (open.length) {
              const reason = 'Ordem aberta existente (anti-duplicação)';
              await push('⚠️', `${symbol}: ${reason}`, 'risk');
              await logAnalysis(userId, { symbol, signal, price, reasons, timeframe: settings.timeframe, estimated_value: orderBudget, estimated_amount: amount, rejection_reason: reason });
              continue;
            }

            const order = await exchange.createOrder(symbol, 'market', 'buy', amount);
            executed = true;
            await push('💰', `COMPRA REAL ${symbol} amount=${amount} price~${price}`, 'buy', { orderId: order.id });
            await notify(userId, 'Ordem executada', `COMPRA ${symbol} ${amount} @ ${price}`, 'success');
            await logAnalysis(userId, { symbol, signal, price, reasons, timeframe: settings.timeframe, estimated_value: orderBudget, estimated_amount: amount, executed: true, order_id: String(order.id ?? '') });

            // Try to attach SL/TP (best-effort)
            try {
              const sl = price * (1 - Number(settings.stop_loss_pct) / 100);
              const tp = price * (1 + Number(settings.take_profit_pct) / 100);
              await exchange.createOrder(symbol, 'market', 'sell', amount, undefined, { stopLossPrice: sl, takeProfitPrice: tp, reduceOnly: true });
              await push('🎯', `SL=${sl.toFixed(4)} TP=${tp.toFixed(4)} configurados`, 'risk');
            } catch (e: any) {
              await push('⚠️', `Não foi possível anexar SL/TP automáticos: ${e.message}`, 'risk');
            }
            break;
          } else {
            // sell or hold: log analysis (no execution)
            await logAnalysis(userId, {
              symbol, signal, price, reasons, timeframe: settings.timeframe,
              estimated_value: orderBudget,
              rejection_reason: signal === 'hold' ? 'Sinal neutro (sem oportunidade)' : 'Sinal de venda não suportado em modo spot/compra',
            });
          }
        } catch (e: any) {
          await push('❌', `Erro em ${symbol}: ${e.message}`, 'error');
          await logAnalysis(userId, { symbol, signal: 'error', timeframe: settings.timeframe, rejection_reason: e.message });
        }
      }

      if (!executed) await push('🔄', 'Nenhuma oportunidade neste ciclo');
      return json({ success: true, logs });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (error: any) {
    console.error('Bot Error:', error);
    return json({ success: false, error: error.message ?? String(error) }, 500);
  }
});
