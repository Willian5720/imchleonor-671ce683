import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function BotSettings() {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.functions.invoke('bybit-bot', { body: { action: 'get_settings' } })
      .then(({ data }) => data?.settings && setS(data.settings));
  }, []);

  if (!s) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Carregando...</CardContent></Card>;

  const set = (k: string, v: any) => setS({ ...s, [k]: v });

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('bybit-bot', {
      body: { action: 'save_settings', settings: s },
    });
    setSaving(false);
    if (error || !data?.success) toast({ title: 'Erro', description: error?.message ?? data?.error, variant: 'destructive' });
    else toast({ title: 'Salvo', description: 'Configurações atualizadas.' });
  };

  const num = (k: string, label: string, step = '0.01') => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" step={step} value={s[k]} onChange={(e) => set(k, parseFloat(e.target.value))} />
    </div>
  );
  const sw = (k: string, label: string) => (
    <div className="flex items-center justify-between border rounded-md p-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={!!s[k]} onCheckedChange={(v) => set(k, v)} />
    </div>
  );

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> Configurações do Bot (LIVE)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {num('max_order_usdt', 'Máx por ordem (USDT)')}
          {num('max_pct_balance', '% máx do saldo')}
          {num('stop_loss_pct', 'Stop Loss (%)')}
          {num('take_profit_pct', 'Take Profit (%)')}
          {num('daily_loss_limit', 'Perda máx diária')}
          {num('weekly_loss_limit', 'Perda máx semanal')}
        </div>
        <div>
          <Label className="text-xs">Ativos (separados por vírgula)</Label>
          <Input value={(s.assets || []).join(',')} onChange={(e) => set('assets', e.target.value.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean))} />
        </div>
        <div>
          <Label className="text-xs">Timeframe</Label>
          <Input value={s.timeframe} onChange={(e) => set('timeframe', e.target.value)} placeholder="1m, 5m, 15m, 1h, 4h, 1d" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sw('use_rsi', 'RSI')}
          {sw('use_macd', 'MACD')}
          {sw('use_ema', 'EMA')}
          {sw('use_bollinger', 'Bollinger')}
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
