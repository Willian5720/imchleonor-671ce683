import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Log { id: string; type: string; emoji: string | null; message: string; created_at: string; }

export function BotLogs() {
  const [logs, setLogs] = useState<Log[]>([]);

  const load = async () => {
    const { data } = await supabase.functions.invoke('bybit-bot', { body: { action: 'get_logs' } });
    if (data?.logs) setLogs(data.logs);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('bot_logs_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_logs' }, (p) => {
        setLogs((cur) => [p.new as Log, ...cur].slice(0, 200));
      }).subscribe();
    const id = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(id); };
  }, []);

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Logs Persistentes (DB)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] rounded-md border border-border/40 bg-black/40 p-3 font-mono text-xs">
          {logs.length === 0 && <div className="text-muted-foreground">Sem registros ainda.</div>}
          {logs.map((l) => (
            <div key={l.id} className={cn('py-0.5',
              l.type === 'buy' || l.type === 'sell' ? 'text-green-400' :
              l.type === 'signal' ? 'text-blue-400' :
              l.type === 'risk' ? 'text-amber-400' :
              l.type === 'error' ? 'text-red-500' : 'text-muted-foreground')}>
              [{new Date(l.created_at).toLocaleTimeString()}] {l.emoji} {l.message}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
