import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: '24h', label: 'Hoje' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'Todos' },
];

export function HistoryPanel() {
  const [period, setPeriod] = useState('30d');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const t = setTimeout(() => {
      supabase.functions.invoke('bybit-bot', {
        body: { action: 'history', period: period === 'all' ? '1y' : period, search },
      }).then(({ data }) => {
        if (cancel) return;
        if (data?.success) setOrders(data.orders || []);
        setLoading(false);
      });
    }, 300);
    return () => { cancel = true; clearTimeout(t); };
  }, [period, search]);

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Histórico de Investimentos
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {PERIODS.map(p => <TabsTrigger key={p.value} value={p.value} className="text-xs px-3">{p.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar ativo (ex: BTC)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-60" /> : orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma operação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Lado</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(o.datetime).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{o.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        'text-[10px] uppercase',
                        o.side === 'buy' ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400',
                      )}>{o.side}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(o.price ?? 0).toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(o.filled ?? o.amount).toFixed(6)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">${Number(o.cost ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-[10px] text-muted-foreground">{Number(o.fee).toFixed(4)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}