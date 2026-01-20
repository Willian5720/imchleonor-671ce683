import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  DollarSign,
  Loader2,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { useDerivIntegration } from '@/hooks/useDerivIntegration';
import { useUserProfile } from '@/hooks/useUserProfile';

export const DerivTransferForm: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { loading, deposit, withdraw, exchangeRate, derivBalance } = useDerivIntegration();
  const { profile, refetch } = useUserProfile();

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      await deposit(amount);
      setDepositAmount('');
      refetch();
    } catch {
      // Error handled in hook
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      await withdraw(amount);
      setWithdrawAmount('');
      refetch();
    } catch {
      // Error handled in hook
    }
  };

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Transferência IMCH ↔ Deriv
            </CardTitle>
            <CardDescription>
              Taxa de câmbio: 1 IMCH = ${exchangeRate.toFixed(4)} USD
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo IMCH</p>
              <p className="font-bold text-primary">
                {profile?.coins?.toLocaleString() || 0} IMCH
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo Deriv</p>
              <p className="font-bold text-green-500">
                ${derivBalance.toFixed(2)} USD
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Depositar na Deriv
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Retirar da Deriv
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Depositar IMCH → Deriv</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Converta suas IMCH Coins em saldo USD na sua conta Deriv para trading.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Quantidade (IMCH)</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                    className="text-xs"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount((profile?.coins || 0).toString())}
                  className="text-xs"
                >
                  Máx
                </Button>
              </div>
            </div>
            
            {depositAmount && parseFloat(depositAmount) > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você enviará:</span>
                  <span className="font-medium">{parseFloat(depositAmount).toLocaleString()} IMCH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você receberá:</span>
                  <span className="font-medium text-green-500">
                    ${(parseFloat(depositAmount) * exchangeRate).toFixed(2)} USD
                  </span>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleDeposit}
              disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > (profile?.coins || 0)}
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Depositar na Deriv
            </Button>
          </TabsContent>
          
          <TabsContent value="withdraw" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Retirar Deriv → IMCH</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Converta seu saldo USD da Deriv de volta para IMCH Coins.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Quantidade (IMCH)</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className="text-xs"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
            
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você enviará:</span>
                  <span className="font-medium">
                    ${(parseFloat(withdrawAmount) * exchangeRate).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você receberá:</span>
                  <span className="font-medium text-primary">
                    {parseFloat(withdrawAmount).toLocaleString()} IMCH
                  </span>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleWithdraw}
              disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              variant="secondary"
              className="w-full gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              Retirar da Deriv
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Blockchain
          </Badge>
          <span>Todas as transações são registradas na blockchain IMCH</span>
        </div>
      </CardContent>
    </Card>
  );
};
