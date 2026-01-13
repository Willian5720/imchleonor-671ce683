import { useState } from 'react';
import { Send, Loader2, ArrowRight, Coins, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile, useUserTransfers } from '@/hooks/useUserProfile';

export function SendTransferForm() {
  const { toast } = useToast();
  const { profile, refetch: refetchProfile } = useUserProfile();
  const { sendTransfer } = useUserTransfers();
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (!recipientEmail || !amountNum || amountNum <= 0) {
      setError('Por favor, preencha todos os campos corretamente.');
      return;
    }

    if (profile && amountNum > profile.coins) {
      setError('Saldo insuficiente para esta transferência.');
      return;
    }

    setSending(true);
    const result = await sendTransfer(recipientEmail, amountNum, note || undefined);
    setSending(false);

    if (result.success) {
      toast({
        title: 'Transferência realizada!',
        description: `${amountNum} COINS enviados para ${recipientEmail}`,
      });
      setRecipientEmail('');
      setAmount('');
      setNote('');
      refetchProfile();
    } else {
      setError(result.error || 'Erro ao realizar transferência');
    }
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Enviar COINS
        </CardTitle>
        <CardDescription>
          Transfira COINS para outro usuário da plataforma
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Display */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Seu saldo</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-primary">
                {profile?.coins?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">Email do Destinatário</Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="bg-background/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade (COINS)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              max={profile?.coins || 0}
              className="bg-background/50"
              required
            />
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(qa.toString())}
                  disabled={!profile || qa > profile.coins}
                >
                  {qa}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setAmount((profile?.coins || 0).toString())}
                disabled={!profile || profile.coins <= 0}
              >
                Máx
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione uma mensagem..."
              className="bg-background/50 min-h-[60px]"
            />
          </div>

          {/* Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 rounded-lg bg-background/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enviando</span>
                <span className="font-medium">{parseFloat(amount).toLocaleString()} COINS</span>
              </div>
              {profile && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo após</span>
                  <span className="font-medium text-primary">
                    {(profile.coins - parseFloat(amount)).toLocaleString()} COINS
                  </span>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Enviar Transferência
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
