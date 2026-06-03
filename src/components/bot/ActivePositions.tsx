import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function ActivePositions() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const fetchPos = async () => {
      const { data } = await supabase.functions.invoke('bybit-bot', { body: { action: 'positions' } });
      if (cancel) return;
      if (data?.success) setPositions(data.positions || []);
      setLoading(false);
    };
    fetchPos();
    const id = setInterval(fetchPos, 5000);
    return () => { cancel = true; clearInterval(id); };
  }, []);

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Operações Ativas
          <Badge variant="outline" className="ml-2 text-[10px]">tempo real • 5s</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-40" /> : positions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma posição aberta no momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Lado</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">PnL %</TableHead>
                  <TableHead className="text-right">PnL USDT</TableHead>
                  <TableHead className="text-right">SL / TP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p, i) => {
                  const pnl = Number(p.unrealizedPnl ?? 0);
                  const pct = Number(p.percentage ?? 0);
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          'text-[10px] uppercase',
                          p.side === 'long' ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400',
                        )}>
                          {p.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{p.contracts}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{Number(p.entryPrice).toFixed(4)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{Number(p.markPrice).toFixed(4)}</TableCell>
                      <TableCell className={cn('text-right font-mono text-xs', pct >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                      </TableCell>
                      <TableCell className={cn('text-right font-mono text-xs', pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                        {p.stopLoss ?? '—'} / {p.takeProfit ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}