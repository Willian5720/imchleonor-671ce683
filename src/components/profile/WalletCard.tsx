import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type Step = 'card' | 'amount' | 'payment' | 'processing' | 'success';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'multicaixa',
    name: 'Multicaixa Express',
    icon: <CreditCard className="h-5 w-5" />,
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/50',
  },
  {
    id: 'unitel',
    name: 'Unitel Money',
    icon: <Smartphone className="h-5 w-5" />,
    color: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/50',
  },
  {
    id: 'paypay',
    name: 'PayPay Angola',
    icon: <Wallet className="h-5 w-5" />,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50',
  },
  {
    id: 'bai',
    name: 'BAI Directo',
    icon: <Building className="h-5 w-5" />,
    color: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/50',
  },
];

const TRANSACTION_FEE = 0.90; // 90 cêntimos por IMCH

export const WalletCard: React.FC = () => {
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const { AOA_TO_IMCH, IMCH_TO_AOA, loading: ratesLoading } = useExchangeRates();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('card');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'withdraw'>('add');
  const [aoaAmount, setAoaAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const loading = profileLoading || ratesLoading;
  const imchBalance = profile?.coins || 0;
  const aoaEquivalent = imchBalance * IMCH_TO_AOA;

  const openAddModal = () => {
    setModalType('add');
    setStep('amount');
    setAoaAmount('');
    setSelectedPayment(null);
    setModalOpen(true);
  };

  const openWithdrawModal = () => {
    setModalType('withdraw');
    setStep('amount');
    setAoaAmount('');
    setSelectedPayment(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStep('card');
    setAoaAmount('');
    setSelectedPayment(null);
  };

  const goBack = () => {
    if (step === 'payment') setStep('amount');
    else if (step === 'amount') closeModal();
  };

  const aoaValue = parseFloat(aoaAmount) || 0;
  const imchBeforeFee = aoaValue * AOA_TO_IMCH;
  const transactionFee = imchBeforeFee * (TRANSACTION_FEE / 100);
  const imchAfterFee = imchBeforeFee - transactionFee;

  const minAOA = 1000;
  const maxAOA = 500000;

  const handleProceed = () => {
    if (aoaValue < minAOA) {
      toast.error(`Valor mínimo: ${minAOA.toLocaleString()} AOA`);
      return;
    }
    if (aoaValue > maxAOA) {
      toast.error(`Valor máximo: ${maxAOA.toLocaleString()} AOA`);
      return;
    }
    setStep('payment');
  };

  const handlePayment = async (methodId: string) => {
    if (!user) return;
    
    setSelectedPayment(methodId);
    setStep('processing');
    setProcessing(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error } = await supabase.rpc('add_balance_with_conversion', {
        p_user_id: user.id,
        p_amount: aoaValue,
        p_from_currency: 'AOA',
        p_to_currency: 'IMCH',
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; converted_amount?: number };
      
      if (result.success) {
        setStep('success');
        refetch();
      } else {
        throw new Error(result.error || 'Erro na conversão');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro ao processar pagamento');
      setStep('payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Credit Card Style Wallet */}
      <div className="space-y-4">
        <div 
          className="relative w-full h-48 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(270 70% 40%) 0%, hsl(200 100% 40%) 50%, hsl(150 100% 40%) 100%)',
          }}
        >
          {/* Holographic overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            }}
          />
          
          {/* Card content */}
          <div className="relative z-10 h-full p-5 flex flex-col justify-between text-white">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs opacity-80 mb-1">Saldo IMCH Coin</p>
                <p className="text-2xl font-bold tracking-tight">
                  1 IMCH = {IMCH_TO_AOA.toLocaleString('pt-AO')} AOA
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg">💎</span>
              </div>
            </div>

            {/* Balance */}
            <div>
              <p className="text-4xl font-bold tracking-tight mb-1">
                {imchBalance.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg ml-2 font-normal opacity-80">IMCH</span>
              </p>
              <p className="text-sm opacity-80">
                Kz {aoaEquivalent.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
              </p>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={openAddModal}
            className="flex-1 h-12 gap-2 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground font-medium rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Adicionar+
          </Button>
          <Button
            onClick={openWithdrawModal}
            variant="outline"
            className="flex-1 h-12 gap-2 border-border/50 hover:bg-muted/50 font-medium rounded-xl"
          >
            <Minus className="h-5 w-5" />
            Retirar
          </Button>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          {/* Amount Step */}
          {step === 'amount' && (
            <>
              <DialogHeader className="flex-row items-center gap-3">
                <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl">
                  {modalType === 'add' ? 'Adicionar' : 'Retirar'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <p className="text-lg font-medium mb-4">
                    Quanto você quer {modalType === 'add' ? 'adicionar' : 'retirar'}?
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold">Kz</span>
                    <Input
                      type="number"
                      value={aoaAmount}
                      onChange={(e) => setAoaAmount(e.target.value)}
                      placeholder="0"
                      className="text-4xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                      style={{ fontSize: '2.5rem' }}
                    />
                    <span className="text-xl text-muted-foreground">AOA</span>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Saldo: {imchBalance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH</p>
                    <p>Min. {minAOA.toLocaleString('pt-AO')} AOA / Max. {maxAOA.toLocaleString('pt-AO')} AOA</p>
                  </div>
                </div>

                {aoaValue > 0 && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        💱
                      </div>
                      <span>P2P</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Você receberá</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold">
                        {imchAfterFee.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg text-muted-foreground">IMCH</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1 IMCH = {IMCH_TO_AOA.toLocaleString('pt-AO')} AOA
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Taxa de transação: {TRANSACTION_FEE}% ({transactionFee.toFixed(4)} IMCH)
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <Clock className="h-3 w-3" />
                      <span>1 minuto</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleProceed}
                  disabled={aoaValue < minAOA}
                  className="w-full h-12 text-lg font-medium rounded-xl"
                >
                  Prosseguir
                </Button>
              </div>
            </>
          )}

          {/* Payment Methods Step */}
          {step === 'payment' && (
            <>
              <DialogHeader className="flex-row items-center gap-3">
                <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl">Escolha o método de pagamento</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-4">
                <div className="p-3 rounded-lg bg-muted/30 mb-4">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-2xl font-bold">Kz {aoaValue.toLocaleString('pt-AO')} AOA</p>
                  <p className="text-sm text-primary">
                    → {imchAfterFee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH
                  </p>
                </div>

                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    onClick={() => handlePayment(method.id)}
                    className={`w-full h-16 justify-start gap-4 rounded-xl bg-gradient-to-r ${method.color} transition-all`}
                  >
                    <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                      {method.icon}
                    </div>
                    <span className="text-base font-medium">{method.name}</span>
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Processando pagamento...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto confirmamos sua transação
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <p className="text-xl font-bold">Pagamento Confirmado!</p>
              <p className="text-muted-foreground">
                {imchAfterFee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH foram adicionados à sua carteira
              </p>
              <Button onClick={closeModal} className="w-full h-12 rounded-xl">
                Concluir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
