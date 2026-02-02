import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, CheckCircle2, Search, Users } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'search' | 'amount' | 'processing' | 'success';

interface FoundUser {
  id: string;
  email_hint: string;
  display_name: string | null;
}

export const UserTransferDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { profile, refetch } = useUserProfile();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('search');
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const imchBalance = profile?.coins || 0;
  const imchToSend = parseFloat(inputAmount) || 0;

  const closeModal = () => {
    onOpenChange(false);
    setStep('search');
    setSearchEmail('');
    setFoundUser(null);
    setInputAmount('');
    setNote('');
  };

  const handleSearch = async () => {
    if (!searchEmail || searchEmail.length < 3) {
      toast.error('Digite pelo menos 3 caracteres');
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-users', {
        body: { email: searchEmail }
      });

      if (error) throw error;

      if (data.users && data.users.length > 0) {
        const foundUserData = data.users[0];
        if (foundUserData.id === user?.id) {
          toast.error('Você não pode transferir para você mesmo');
          return;
        }
        setFoundUser(foundUserData);
        setStep('amount');
      } else {
        toast.error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erro ao buscar usuário');
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!user || !foundUser || imchToSend <= 0) return;
    
    if (imchToSend > imchBalance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setStep('processing');
    setProcessing(true);

    try {
      const { data, error } = await supabase.rpc('transfer_between_users', {
        p_from_user_id: user.id,
        p_to_user_id: foundUser.id,
        p_amount: imchToSend,
        p_currency: 'IMCH',
        p_note: note || null
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        setStep('success');
        refetch();
        onSuccess();
      } else {
        throw new Error(result.error || 'Erro na transferência');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Erro ao processar transferência');
      setStep('amount');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {step === 'search' && (
          <>
            <DialogHeader className="flex-row items-center gap-3">
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Transferir para Usuário
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Email do destinatário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Digite o email do usuário"
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Busque pelo email do usuário que receberá a transferência
                </p>
              </div>

              <Button
                onClick={handleSearch}
                disabled={searching || searchEmail.length < 3}
                className="w-full h-12 rounded-xl"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar Usuário
              </Button>
            </div>
          </>
        )}

        {step === 'amount' && foundUser && (
          <>
            <DialogHeader className="flex-row items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setStep('search')} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-xl">Valor da Transferência</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Destinatário */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Destinatário</p>
                <p className="font-medium">
                  {foundUser.display_name || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground">{foundUser.email_hint}</p>
              </div>

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

              <div className="space-y-2">
                <Label>Nota (opcional)</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Pagamento do almoço"
                  maxLength={100}
                />
              </div>

              {imchToSend > imchBalance && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Saldo insuficiente
                  </p>
                </div>
              )}

              <Button
                onClick={handleTransfer}
                disabled={imchToSend <= 0 || imchToSend > imchBalance}
                className="w-full h-12 text-lg font-medium rounded-xl"
              >
                Transferir {imchToSend > 0 ? `${imchToSend.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH` : ''}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Processando transferência...</p>
            <p className="text-sm text-muted-foreground">
              Enviando para {foundUser?.display_name || 'usuário'}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl font-bold">Transferência Concluída!</p>
            <p className="text-muted-foreground">
              {imchToSend.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} IMCH foram enviados para {foundUser?.display_name || 'o usuário'}
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
