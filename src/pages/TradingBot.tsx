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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
    profit: 'text-green-400',
    loss: 'text-red-400',
    info: 'text-primary',
    warn: 'text-amber-400',
  }[tone];
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Icon className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">{label}</span>
        </div>
        <div className={cn('text-xl font-bold font-mono', toneClasses)}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
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
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
              <Cpu className="w-7 h-7 text-primary" /> Bot Trader Bybit
            </h1>
            <p className="text-sm text-muted-foreground">
              Painel em tempo real • Sincronizado com sua conta Bybit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(
              'gap-1.5',
              apiError ? 'border-red-500/40 text-red-400' : 'border-green-500/40 text-green-400',
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                apiError ? 'bg-red-400' : 'bg-green-400 animate-pulse',
              )} />
              API {apiError ? 'Erro' : 'Conectada'}
            </Badge>
            <Badge variant="outline" className={cn(
              'gap-1.5',
              isRunning ? 'border-green-500/40 text-green-400' : 'border-muted-foreground/40',
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                isRunning ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground',
              )} />
              Bot {isRunning ? 'Ativo' : 'Pausado'}
            </Badge>
            {data?.lastSync && (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(data.lastSync).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {apiError && (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Erro na API Bybit</p>
                <p className="text-sm text-muted-foreground mt-1">{apiError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top financial metrics */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Wallet} label="Saldo Total" tone="info"
                value={<AnimatedNumber value={data.totalBalance} prefix="$" />}
                sub="USDT na conta" />
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
          <Card className="border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Controle do Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                  'w-full',
                  isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600',
                )}
              >
                {isRunning
                  ? (<><Pause className="w-4 h-4 mr-2" /> Pausar Bot</>)
                  : (<><Play className="w-4 h-4 mr-2" /> Iniciar Bot</>)}
              </Button>
              <Button variant="outline" onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
                <RefreshCw className={cn('w-4 h-4 mr-2', isAnalyzing && 'animate-spin')} />
                Forçar Análise
              </Button>
              <Button variant="ghost" onClick={fetchDashboard} className="w-full" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Atualizar Painel
              </Button>
              <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-md p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Modo SIMULAÇÃO ativo. Ordens reais serão habilitadas na próxima fase.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/60 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-primary" /> Logs de Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] rounded-md border border-border/40 bg-black/40 p-3 font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className={cn(
                    'py-0.5',
                    l.includes('💰') || l.includes('🟢') ? 'text-green-400' :
                    l.includes('📈') ? 'text-blue-400' :
                    l.includes('📉') ? 'text-red-400' :
                    l.includes('⚠️') ? 'text-amber-400' :
                    l.includes('❌') ? 'text-red-500' :
                    'text-muted-foreground',
                  )}>
                    {l}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}