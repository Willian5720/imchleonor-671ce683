import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Broker {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

const brokers: Broker[] = [
  {
    id: 'deriv',
    name: 'Deriv',
    icon: '📊',
    color: 'text-red-500',
    bgColor: 'from-red-500/20 to-red-600/10 border-red-500/30',
  },
  {
    id: 'bybit',
    name: 'Bybit',
    icon: '🔶',
    color: 'text-yellow-500',
    bgColor: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  },
  {
    id: 'binance',
    name: 'Binance',
    icon: '💛',
    color: 'text-amber-500',
    bgColor: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerId: string | null;
  onSuccess: () => void;
}

type Step = 'amount' | 'processing' | 'success';

const TRANSACTION_FEE_PERCENT = 30;

export const BrokerTransferDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  brokerId,
  onSuccess,
}) => {
  const { profile, refetch } = useUserProfile();
  const { IMCH_TO_AOA } = useExchangeRates();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('amount');
  const [inputAmount, setInputAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const imchBalance = profile?.coins || 0;
  const broker = brokers.find(b => b.id === brokerId);
  
  const imchToSend = parseFloat(inputAmount) || 0;
  const fee = imchToSend * (TRANSACTION_FEE_PERCENT / 100);
  const imchAfterFee = imchToSend - fee;

  const closeModal = () => {
    onOpenChange(false);
    setStep('amount');
    setInputAmount('');
  };

  const handleTransfer = async () => {
    if (!user || !broker || imchToSend <= 0) return;
    
    if (imchToSend > imchBalance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setStep('processing');
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Deduzir do saldo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          coins: imchBalance - imchToSend,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Registrar transferência
      await supabase
        .from('user_transfers')
        .insert({
          from_user_id: user.id,
          to_user_id: user.id,
          amount: imchToSend,
          currency: `BROKER_${broker.id.toUpperCase()}`,
          note: `Transferência de ${imchAfterFee.toFixed(2)} IMCH para ${broker.name}`,
          status: 'completed'
        });

      setStep('success');
      refetch();
      onSuccess();
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Erro ao processar transferência');
      setStep('amount');
    } finally {
      setProcessing(false);
    }
  };

  if (!broker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {step === 'amount' && (
          <>
            <DialogHeader className="flex-row items-center gap-3">
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-xl flex items-center gap-2">
                <span className="text-2xl">{broker.icon}</span>
                Enviar para {broker.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <p className="text-lg font-medium mb-4">Quantos IMCH você quer enviar?</p>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <Input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="0"
                    className="text-4xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    style={{ fontSize: '2.5rem' }}
                  />
                  <span className="text-xl text-muted-foreground">IMCH</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Saldo disponível: {imchBalance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH
                </p>
              </div>

              {imchToSend > 0 && (
                <div className={`p-4 rounded-xl border bg-gradient-to-r ${broker.bgColor} space-y-3`}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-2xl">{broker.icon}</span>
                    <span>Transferência para {broker.name}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IMCH a enviar:</span>
                      <span className="font-medium">{imchToSend.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                      <span>Taxa ({TRANSACTION_FEE_PERCENT}%):</span>
                      <span>-{fee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground mb-1">{broker.name} receberá</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${broker.color}`}>
                        {imchAfterFee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg text-muted-foreground">IMCH</span>
                    </div>
                  </div>

                  {imchToSend > imchBalance && (
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-xs text-destructive font-medium">
                        ⚠️ Saldo insuficiente
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <Clock className="h-3 w-3" />
                    <span>Processamento em 5-30 minutos</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleTransfer}
                disabled={imchToSend <= 0 || imchToSend > imchBalance}
                className="w-full h-12 text-lg font-medium rounded-xl"
              >
                Enviar para {broker.name}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Processando transferência...</p>
            <p className="text-sm text-muted-foreground">
              Enviando para {broker.name}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl font-bold">Transferência Enviada!</p>
            <p className="text-muted-foreground">
              {imchAfterFee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH foram enviados para {broker.name}
            </p>
            <Button onClick={closeModal} className="w-full h-12 rounded-xl">
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const BrokerButtons: React.FC<{ onSelect: (brokerId: string) => void }> = ({ onSelect }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Enviar para Corretora</h3>
      <div className="grid grid-cols-3 gap-3">
        {brokers.map((broker) => (
          <Button
            key={broker.id}
            variant="outline"
            onClick={() => onSelect(broker.id)}
            className={`h-20 flex-col gap-2 rounded-xl bg-gradient-to-br ${broker.bgColor} hover:opacity-80 transition-all`}
          >
            <span className="text-2xl">{broker.icon}</span>
            <span className="text-xs font-medium">{broker.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export { brokers };
