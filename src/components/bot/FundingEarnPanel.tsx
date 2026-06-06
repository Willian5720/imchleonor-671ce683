import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, PiggyBank, ArrowRightLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const fmt = (v: number) => (v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

export function FundingEarnPanel({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState<'FUND' | 'UNIFIED'>('FUND');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const to = from === 'FUND' ? 'UNIFIED' : 'FUND';

  const transfer = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast({ title: 'Valor inválido', variant: 'destructive' });
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke('bybit-bot', {
      body: { action: 'transfer_internal', amount: amt, coin: 'USDT', from, to },
    });
    setLoading(false);
    if (error || !res?.success) {
      toast({ title: 'Falha', description: error?.message ?? res?.error, variant: 'destructive' });
    } else {
      toast({ title: 'Transferência concluída', description: `${amt} USDT ${from} → ${to}` });
      setAmount('');
      onRefresh();
    }
  };

  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-md border border-border/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="w-3.5 h-3.5" /> FUNDING (Carteira)
            </div>
            <div className="text-xl font-bold font-mono">${fmt(data.fundingBalance ?? 0)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">USDT — disponível para transferir</div>
          </div>
          <div className="rounded-md border border-border/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <PiggyBank className="w-3.5 h-3.5" /> EARN (Rendimento)
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">${fmt(data.earnBalance ?? 0)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {(data.earnPositions?.length ?? 0)} produto(s) — resgate manual na Bybit
            </div>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5" /> TOTAL COMBINADO
            </div>
            <div className="text-xl font-bold font-mono text-primary">${fmt(data.combinedBalance ?? 0)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Unified + Funding + Earn</div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-3">
          <div className="text-xs text-muted-foreground mb-2">Transferência interna (para o bot operar, mova de FUNDING para UNIFIED)</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as any)}
              className="bg-background border border-border/40 rounded-md px-3 text-sm h-10"
            >
              <option value="FUND">De: FUNDING</option>
              <option value="UNIFIED">De: UNIFIED</option>
            </select>
            <div className="flex items-center text-xs text-muted-foreground px-2">→ {to}</div>
            <Input
              type="number" step="0.01" placeholder="Valor USDT"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={transfer} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
              Transferir
            </Button>
          </div>
          {(data.earnBalance ?? 0) > 0 && (
            <div className="text-[11px] text-amber-400 mt-2">
              ⚠️ Você tem ${fmt(data.earnBalance)} em Earn. A Bybit não permite resgate de produtos Earn via API — faça o resgate manualmente no app/site da Bybit (Earn → Redeem). Depois o valor aparece em FUNDING e você pode transferir aqui.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}