import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';

const PERIODS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1a' },
];

export function EquityChart() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [equity, setEquity] = useState<any[]>([]);
  const [btc, setBtc] = useState<any[]>([]);
  const [eth, setEth] = useState<any[]>([]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    supabase.functions.invoke('bybit-bot', { body: { action: 'equity_chart', period } })
      .then(({ data }) => {
        if (cancel || !data?.success) return;
        setEquity((data.equity || []).map((p: any) => ({ ...p, t: new Date(p.time).toLocaleDateString() })));
        const merged: Record<number, any> = {};
        (data.btc || []).forEach((p: any) => { merged[p.time] = { ...merged[p.time], time: p.time, btc: p.change }; });
        (data.eth || []).forEach((p: any) => { merged[p.time] = { ...merged[p.time], time: p.time, eth: p.change }; });
        const arr = Object.values(merged).sort((a: any, b: any) => a.time - b.time)
          .map((p: any) => ({ ...p, t: new Date(p.time).toLocaleDateString() }));
        setBtc(arr); setEth(arr);
      })
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LineIcon className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Análise Gráfica</h2>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {PERIODS.map(p => (
              <TabsTrigger key={p.value} value={p.value} className="text-xs px-3">{p.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Evolução do Patrimônio (PnL Acumulado)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[280px]" /> : equity.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Sem operações fechadas neste período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#eq)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Comparação BTC vs ETH (% no período)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[260px]" /> : btc.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Sem dados de mercado.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={btc}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="btc" stroke="#f7931a" strokeWidth={2} dot={false} name="BTC" />
                <Line type="monotone" dataKey="eth" stroke="#627eea" strokeWidth={2} dot={false} name="ETH" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}