import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Search, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];
const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'executed', label: 'Executadas' },
  { value: 'rejected', label: 'Recusadas' },
  { value: 'buy', label: 'Alta' },
  { value: 'sell', label: 'Baixa' },
  { value: 'hold', label: 'Neutro' },
];

interface Analysis {
  id: string; created_at: string; symbol: string; signal: string;
  price: number | null; estimated_value: number | null; estimated_amount: number | null;
  reasons: string[] | null; executed: boolean; rejection_reason: string | null;
  order_id: string | null; timeframe: string | null;
}

function SignalBadge({ signal }: { signal: string }) {
  if (signal === 'buy') return (
    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-[10px] uppercase gap-1">
      <TrendingUp className="w-3 h-3" /> ALTA
    </Badge>
  );
  if (signal === 'sell') return (
    <Badge variant="outline" className="border-red-500/40 text-red-400 font-mono text-[10px] uppercase gap-1">
      <TrendingDown className="w-3 h-3" /> BAIXA
    </Badge>
  );
  if (signal === 'error') return (
    <Badge variant="outline" className="border-red-500/40 text-red-500 font-mono text-[10px] uppercase">ERRO</Badge>
  );
  return (
    <Badge variant="outline" className="border-zinc-500/40 text-zinc-400 font-mono text-[10px] uppercase gap-1">
      <Minus className="w-3 h-3" /> NEUTRO
    </Badge>
  );
}

export function AnalysisHistory() {
  const [period, setPeriod] = useState('7d');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const t = setTimeout(() => {
      supabase.functions.invoke('bybit-bot', {
        body: { action: 'get_analyses', period, filter, search },
      }).then(({ data }) => {
        if (cancel) return;
        if (data?.success) setRows(data.analyses || []);
        setLoading(false);
      });
    }, 250);
    return () => { cancel = true; clearTimeout(t); };
  }, [period, filter, search]);

  const executed = rows.filter(r => r.executed).length;
  const rejected = rows.filter(r => !r.executed && r.rejection_reason).length;

  return (
    <div className="term-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="term-label">HISTÓRICO DE ANÁLISES &amp; ORDENS</span>
      </div>
      <div className="term-divider" />

      <div className="grid grid-cols-3 gap-3">
        <div className="term-card p-3">
          <div className="term-label text-[10px]">TOTAL</div>
          <div className="term-value text-xl">{rows.length}</div>
        </div>
        <div className="term-card p-3">
          <div className="term-label text-[10px] term-glow-green">EXECUTADAS</div>
          <div className="term-value text-xl term-glow-green">{executed}</div>
        </div>
        <div className="term-card p-3">
          <div className="term-label text-[10px] term-glow-amber">RECUSADAS</div>
          <div className="term-value text-xl term-glow-amber">{rejected}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {PERIODS.map(p => <TabsTrigger key={p.value} value={p.value} className="text-xs px-3">{p.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {FILTERS.map(f => <TabsTrigger key={f.value} value={f.value} className="text-xs px-2">{f.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrar par (ex: BTC)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm font-mono"
          />
        </div>
      </div>

      {loading ? <Skeleton className="h-72" /> : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground font-mono">
          Nenhuma análise registrada neste período. Execute "Forçar Análise" para gerar dados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-primary/20 bg-black/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[10px] uppercase">Data/Hora</TableHead>
                <TableHead className="font-mono text-[10px] uppercase">Par</TableHead>
                <TableHead className="font-mono text-[10px] uppercase">Sinal</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase">Preço</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase">Valor Est.</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase">Qtd</TableHead>
                <TableHead className="font-mono text-[10px] uppercase">Status</TableHead>
                <TableHead className="font-mono text-[10px] uppercase">Motivo / Indicadores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">{r.symbol}</TableCell>
                  <TableCell><SignalBadge signal={r.signal} /></TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {r.price != null ? `$${Number(r.price).toFixed(4)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {r.estimated_value != null ? `$${Number(r.estimated_value).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                    {r.estimated_amount != null ? Number(r.estimated_amount).toFixed(6) : '—'}
                  </TableCell>
                  <TableCell>
                    {r.executed ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" /> EXECUTADA
                      </Badge>
                    ) : r.rejection_reason ? (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-400 font-mono text-[10px] gap-1">
                        <XCircle className="w-3 h-3" /> RECUSADA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-500/40 text-zinc-400 font-mono text-[10px]">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className={cn(
                      'text-[11px] font-mono',
                      r.rejection_reason ? 'text-amber-400' : 'text-muted-foreground',
                    )}>
                      {r.rejection_reason ?? (r.reasons?.length ? r.reasons.join(' · ') : '—')}
                    </div>
                    {r.order_id && (
                      <div className="text-[10px] font-mono text-emerald-400/70 mt-0.5">
                        Ordem: {r.order_id}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}