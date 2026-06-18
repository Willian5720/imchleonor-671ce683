import { useEffect, useState, useCallback } from 'react';
import {
  Play, Pause, RefreshCw, Activity, Wallet, TrendingUp, TrendingDown,
  Target, History as HistoryIcon, AlertCircle, Cpu, CheckCircle2, Clock,
  LineChart, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { EquityChart } from '@/components/bot/EquityChart';
import { ActivePositions } from '@/components/bot/ActivePositions';
import { HistoryPanel } from '@/components/bot/HistoryPanel';
import { BotSettings } from '@/components/bot/BotSettings';
import { BotLogs } from '@/components/bot/BotLogs';
import { FundingEarnPanel } from '@/components/bot/FundingEarnPanel';
import { AnalysisHistory } from '@/components/bot/AnalysisHistory';

interface Dashboard {
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
  investedCapital: number;
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  totalProfit: number;
  unrealizedPnl: number;
  roi: number;
  apiStatus: string;
  botStatus: string;
  openPositions: number;
  lastSync: string;
  fundingBalance?: number;
  earnBalance?: number;
  combinedBalance?: number;
  earnPositions?: { coin: string; amount: number }[];
}

const fmt = (v: number, d = 2) =>
  v?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '0.00';

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className }: any) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.0001) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(start + diff * (0.5 - Math.cos(p * Math.PI) / 2));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{prefix}{fmt(display, decimals)}{suffix}</span>;
}

function MetricCard({
  icon: Icon, label, value, sub, tone = 'default',
}: {
  icon: any; label: string; value: React.ReactNode; sub?: React.ReactNode;
  tone?: 'default' | 'profit' | 'loss' | 'info' | 'warn';
}) {
  const toneClasses = {
    default: 'text-foreground',
    profit: 'term-glow-green',
    loss: 'term-glow-red',
    info: 'term-glow-blue',
    warn: 'term-glow-amber',
  }[tone];
  const ledColor = {
    default: 'text-muted-foreground',
    profit: 'text-emerald-400',
    loss: 'text-red-400',
    info: 'text-sky-400',
    warn: 'text-amber-400',
  }[tone];
  return (
    <div className="term-card p-4 group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-primary/70" />
          <span className="term-label">{label}</span>
        </div>
        <span className={cn('term-led', ledColor)} aria-hidden />
      </div>
      <div className={cn('text-2xl term-value', toneClasses)}>{value}</div>
      {sub && <div className="text-[10px] term-ticker mt-1.5 truncate">{sub}</div>}
    </div>
  );
}

export default function TradingBot() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Bot inicializado. Aguardando comando...']);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const addLog = (m: string) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${m}`, ...p].slice(0, 200));

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke('bybit-bot', {
        body: { action: 'dashboard' },
      });
      if (error) throw error;
      if (res?.success) {
        setData(res.data);
        setApiError(null);
      } else if (res?.error) {
        setApiError(res.error);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    addLog('🔄 Solicitando análise de mercado...');
    try {
      const { data: res, error } = await supabase.functions.invoke('bybit-bot', {
        body: { action: 'analyze_and_trade' },
      });
      if (error) throw error;
      if (res?.success && res.logs) res.logs.forEach((l: string) => addLog(l));
      else if (res?.error) addLog(`❌ Erro: ${res.error}`);
      fetchDashboard();
    } catch (e: any) {
      addLog(`❌ Falha: ${e.message}`);
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, fetchDashboard, toast]);

  useEffect(() => {
    fetchDashboard();
    const id = window.setInterval(fetchDashboard, 15000);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isRunning) return;
    addLog('🤖 Modo automático ativado (análise a cada 1h).');
    runAnalysis();
    const id = window.setInterval(runAnalysis, 3600_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const pnlTone = (v: number) => (v > 0 ? 'profit' : v < 0 ? 'loss' : 'default');
  const pnlPrefix = (v: number) => (v > 0 ? '+$' : v < 0 ? '-$' : '$');
  const pnlVal = (v: number) => Math.abs(v ?? 0);

  return (
    <div className="min-h-screen term-bg term-scanline">
      <div className="term-grid">
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
          {/* Terminal Header */}
          <div className="term-card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-primary/30 blur-lg" />
                  <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/40 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight flex items-center gap-2">
                    BYBIT <span className="text-primary">//</span> TRADER TERMINAL
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="term-ticker">v2.0.LIVE</span>
                    <span className="text-primary/40">·</span>
                    <span className="term-ticker">REAL-TIME SYNC</span>
                    {data?.lastSync && (
                      <>
                        <span className="text-primary/40">·</span>
                        <span className="term-ticker flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(data.lastSync).toLocaleTimeString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="term-chip">
                  <span className={cn('term-led', apiError ? 'text-red-400' : 'text-emerald-400')} />
                  API {apiError ? 'OFFLINE' : 'ONLINE'}
                </span>
                <span className="term-chip">
                  <span className={cn('term-led', isRunning ? 'text-emerald-400' : 'text-zinc-500')} />
                  BOT {isRunning ? 'RUN' : 'IDLE'}
                </span>
                <span className="term-chip term-glow-amber">
                  ⚡ MODO LIVE
                </span>
              </div>
            </div>
            <div className="term-divider mt-4" />
          </div>

        {apiError && (
          <div className="term-card p-4 border-red-500/50 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="term-label term-glow-red">ERRO API BYBIT</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{apiError}</p>
            </div>
          </div>
        )}

        {/* Top financial metrics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="term-tab-list grid grid-cols-3 sm:grid-cols-7 w-full h-auto p-1 gap-1">
            <TabsTrigger value="overview" className="font-mono text-xs uppercase tracking-wider">Visão</TabsTrigger>
            <TabsTrigger value="charts" className="font-mono text-xs uppercase tracking-wider">Gráficos</TabsTrigger>
            <TabsTrigger value="positions" className="font-mono text-xs uppercase tracking-wider">Posições</TabsTrigger>
            <TabsTrigger value="analyses" className="font-mono text-xs uppercase tracking-wider">Análises</TabsTrigger>
            <TabsTrigger value="history" className="font-mono text-xs uppercase tracking-wider">Histórico</TabsTrigger>
            <TabsTrigger value="settings" className="font-mono text-xs uppercase tracking-wider">Config</TabsTrigger>
            <TabsTrigger value="logs" className="font-mono text-xs uppercase tracking-wider">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-2">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Wallet} label="Saldo Total" tone="info"
                value={<AnimatedNumber value={data.totalBalance} prefix="$" />}
                sub="Unified (trading)" />
              <MetricCard icon={CheckCircle2} label="Disponível" tone="profit"
                value={<AnimatedNumber value={data.availableBalance} prefix="$" />}
                sub="Para novas ordens" />
              <MetricCard icon={Activity} label="Bloqueado" tone="warn"
                value={<AnimatedNumber value={data.lockedBalance} prefix="$" />}
                sub="Em operações" />
              <MetricCard icon={Target} label="Capital Investido"
                value={<AnimatedNumber value={data.investedCapital} prefix="$" />}
                sub={`${data.openPositions} posições`} />
            </div>

            <FundingEarnPanel data={data} onRefresh={fetchDashboard} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={TrendingUp} label="Lucro Diário" tone={pnlTone(data.dailyProfit)}
                value={<AnimatedNumber value={pnlVal(data.dailyProfit)} prefix={pnlPrefix(data.dailyProfit)} />} />
              <MetricCard icon={TrendingUp} label="Lucro Semanal" tone={pnlTone(data.weeklyProfit)}
                value={<AnimatedNumber value={pnlVal(data.weeklyProfit)} prefix={pnlPrefix(data.weeklyProfit)} />} />
              <MetricCard icon={TrendingUp} label="Lucro Mensal" tone={pnlTone(data.monthlyProfit)}
                value={<AnimatedNumber value={pnlVal(data.monthlyProfit)} prefix={pnlPrefix(data.monthlyProfit)} />} />
              <MetricCard icon={BarChart3} label="Lucro Total" tone={pnlTone(data.totalProfit)}
                value={<AnimatedNumber value={pnlVal(data.totalProfit)} prefix={pnlPrefix(data.totalProfit)} />} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={LineChart} label="PnL Não Realizado" tone={pnlTone(data.unrealizedPnl)}
                value={<AnimatedNumber value={pnlVal(data.unrealizedPnl)} prefix={pnlPrefix(data.unrealizedPnl)} />}
                sub="Posições abertas" />
              <MetricCard icon={TrendingUp} label="ROI Total" tone={pnlTone(data.roi)}
                value={<AnimatedNumber value={data.roi} suffix="%" />}
                sub="Retorno sobre capital" />
              <MetricCard icon={Activity} label="Posições Abertas" tone="info"
                value={<span>{data.openPositions}</span>} />
              <MetricCard icon={TrendingDown} label="Operações Hoje"
                value={<span>—</span>} sub="Em breve" />
            </div>
          </>
        )}

        {/* Control + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="term-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="term-label">CONTROLE DO BOT</span>
            </div>
            <div className="term-divider mb-2" />
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                  'w-full font-mono uppercase tracking-wider shadow-lg',
                  isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600',
                )}
              >
                {isRunning
                  ? (<><Pause className="w-4 h-4 mr-2" /> Pausar Bot</>)
                  : (<><Play className="w-4 h-4 mr-2" /> Iniciar Bot</>)}
              </Button>
              <Button variant="outline" onClick={runAnalysis} disabled={isAnalyzing} className="w-full font-mono uppercase tracking-wider border-primary/30">
                <RefreshCw className={cn('w-4 h-4 mr-2', isAnalyzing && 'animate-spin')} />
                Forçar Análise
              </Button>
              <Button variant="ghost" onClick={fetchDashboard} className="w-full font-mono text-xs" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Atualizar Painel
              </Button>
              <div className="text-[11px] font-mono text-red-400 bg-red-500/5 border border-red-500/30 rounded-md p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  MODO LIVE — ordens reais são enviadas para sua conta Bybit. Configure limites em "Config".
                </span>
              </div>
          </div>

          <div className="term-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-primary" />
                <span className="term-label">CONSOLE DE OPERAÇÃO</span>
              </div>
              <span className="term-chip text-[10px]">
                <span className="term-led text-emerald-400" /> LIVE FEED
              </span>
            </div>
            <div className="term-divider mb-3" />
            <ScrollArea className="h-[360px] rounded-md border border-primary/20 bg-black/60 p-3 font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className={cn(
                    'py-0.5 border-l-2 pl-2 my-0.5',
                    l.includes('💰') || l.includes('🟢') ? 'text-green-400' :
                    l.includes('📈') ? 'text-blue-400' :
                    l.includes('📉') ? 'text-red-400' :
                    l.includes('⚠️') ? 'text-amber-400' :
                    l.includes('❌') ? 'text-red-500' :
                    'text-muted-foreground border-transparent',
                    l.includes('💰') || l.includes('🟢') ? 'border-green-400/40' :
                    l.includes('📈') ? 'border-blue-400/40' :
                    l.includes('📉') ? 'border-red-400/40' :
                    l.includes('⚠️') ? 'border-amber-400/40' :
                    l.includes('❌') ? 'border-red-500/40' : '',
                  )}>
                    <span className="text-primary/40">$</span> {l}
                  </div>
                ))}
            </ScrollArea>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-2">
            <EquityChart />
          </TabsContent>

          <TabsContent value="positions" className="mt-2">
            <ActivePositions />
          </TabsContent>

          <TabsContent value="history" className="mt-2">
            <HistoryPanel />
          </TabsContent>

          <TabsContent value="analyses" className="mt-2">
            <AnalysisHistory />
          </TabsContent>

          <TabsContent value="settings" className="mt-2">
            <BotSettings />
          </TabsContent>

          <TabsContent value="logs" className="mt-2">
            <BotLogs />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}