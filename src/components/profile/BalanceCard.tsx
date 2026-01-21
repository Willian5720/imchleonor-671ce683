import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Coins,
  Banknote,
  ArrowDownUp,
  Plus,
  Loader2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const BalanceCard: React.FC = () => {
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const { AOA_TO_IMCH, IMCH_TO_AOA, IMCH_TO_USD, loading: ratesLoading } = useExchangeRates();
  const { user } = useAuth();
  const [aoaAmount, setAoaAmount] = useState('');
  const [converting, setConverting] = useState(false);

  const handleAddBalance = async () => {
    if (!user || !aoaAmount) return;

    const amount = parseFloat(aoaAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    setConverting(true);
    try {
      const { data, error } = await supabase.rpc('add_balance_with_conversion', {
        p_user_id: user.id,
        p_amount: amount,
        p_from_currency: 'AOA',
        p_to_currency: 'IMCH',
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; converted_amount?: number };
      
      if (result.success) {
        toast.success(`${result.converted_amount?.toFixed(2)} IMCH adicionados!`);
        setAoaAmount('');
        refetch();
      } else {
        throw new Error(result.error || 'Erro na conversão');
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Erro ao adicionar saldo');
    } finally {
      setConverting(false);
    }
  };

  const quickAmountsAOA = [1000, 5000, 10000, 50000];

  if (profileLoading || ratesLoading) {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const imchBalance = profile?.coins || 0;
  const aoaBalance = (profile as { balance_aoa?: number })?.balance_aoa || 0;
  const usdEquivalent = imchBalance * IMCH_TO_USD;

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Meus Saldos
        </CardTitle>
        <CardDescription>
          Visualize e gerencie seus saldos em IMCH e Kwanza
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">IMCH Coin</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {imchBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${usdEquivalent.toFixed(2)} USD
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Kwanza (AOA)</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">
              {aoaBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {(aoaBalance * AOA_TO_IMCH).toFixed(2)} IMCH
            </p>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">Taxa de Câmbio</span>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">1 IMCH = {IMCH_TO_AOA.toLocaleString()} AOA</p>
            <p className="text-xs text-muted-foreground">Atualizado em tempo real</p>
          </div>
        </div>

        {/* Add Balance Tab */}
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </TabsTrigger>
            <TabsTrigger value="convert" className="gap-2">
              <ArrowDownUp className="h-4 w-4" />
              Converter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="aoa-amount">Valor em Kwanza (AOA)</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="aoa-amount"
                  type="number"
                  placeholder="0"
                  value={aoaAmount}
                  onChange={(e) => setAoaAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickAmountsAOA.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAoaAmount(amount.toString())}
                    className="text-xs"
                  >
                    {amount.toLocaleString()} AOA
                  </Button>
                ))}
              </div>
            </div>

            {aoaAmount && parseFloat(aoaAmount) > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você adiciona:</span>
                  <span className="font-medium">{parseFloat(aoaAmount).toLocaleString()} AOA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você recebe:</span>
                  <span className="font-medium text-primary">
                    {(parseFloat(aoaAmount) * AOA_TO_IMCH).toFixed(2)} IMCH
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddBalance}
              disabled={converting || !aoaAmount || parseFloat(aoaAmount) <= 0}
              className="w-full gap-2"
            >
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Adicionar Saldo
            </Button>
          </TabsContent>

          <TabsContent value="convert" className="space-y-3 mt-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Conversão Instantânea</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use a página Blockchain para converter entre IMCH, Ethereum e Deriv
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
