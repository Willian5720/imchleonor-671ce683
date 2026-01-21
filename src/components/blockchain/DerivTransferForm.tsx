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
  Copy,
  Check,
} from 'lucide-react';
import { useDerivIntegration } from '@/hooks/useDerivIntegration';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserWallets } from '@/hooks/useUserWallets';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { toast } from 'sonner';

export const DerivTransferForm: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const { loading, deposit, withdraw, derivBalance } = useDerivIntegration();
  const { profile, refetch } = useUserProfile();
  const { getImchAddress, getEthAddress, generateAddress } = useUserWallets();
  const { IMCH_TO_USD, IMCH_TO_ETH } = useExchangeRates();

  const imchAddress = getImchAddress();
  const ethAddress = getEthAddress();

  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(address);
    toast.success('Endereço copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      // Gerar endereço Ethereum se não existir para a transação
      let toAddress = ethAddress;
      if (!toAddress) {
        toAddress = await generateAddress('ethereum', 'Deriv Deposit');
      }
      
      await deposit(amount, toAddress || undefined);
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
      // Gerar endereço IMCH se não existir para receber
      let toAddress = imchAddress;
      if (!toAddress) {
        toAddress = await generateAddress('imch', 'Withdrawal Address');
      }
      
      await withdraw(amount, toAddress || undefined);
      setWithdrawAmount('');
      refetch();
    } catch {
      // Error handled in hook
    }
  };

  const quickAmounts = [100, 500, 1000, 5000];

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

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
              Taxa: 1 IMCH = ${IMCH_TO_USD.toFixed(4)} USD | {IMCH_TO_ETH.toFixed(8)} ETH
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
                <span className="text-sm font-medium">Depositar IMCH → Deriv (via Ethereum)</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Converta suas IMCH Coins em saldo USD na sua conta Deriv usando Ethereum como intermediário.
              </p>
              {ethAddress && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <span className="text-xs text-muted-foreground">Endereço ETH:</span>
                  <code className="text-xs font-mono">{formatAddress(ethAddress)}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleCopy(ethAddress)}
                  >
                    {copied === ethAddress ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
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
                  <span className="text-muted-foreground">Via Ethereum:</span>
                  <span className="font-medium text-blue-500">
                    {(parseFloat(depositAmount) * IMCH_TO_ETH).toFixed(8)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Você receberá:</span>
                  <span className="font-medium text-green-500">
                    ${(parseFloat(depositAmount) * IMCH_TO_USD).toFixed(2)} USD
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
                <span className="text-sm font-medium">Retirar Deriv → IMCH (via Ethereum)</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Converta seu saldo USD da Deriv de volta para IMCH Coins via rede Ethereum.
              </p>
              {imchAddress && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <span className="text-xs text-muted-foreground">Endereço IMCH:</span>
                  <code className="text-xs font-mono">{formatAddress(imchAddress)}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleCopy(imchAddress)}
                  >
                    {copied === imchAddress ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
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
                    ${(parseFloat(withdrawAmount) * IMCH_TO_USD).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Via Ethereum:</span>
                  <span className="font-medium text-blue-500">
                    {(parseFloat(withdrawAmount) * IMCH_TO_ETH).toFixed(8)} ETH
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
            SHA-256
          </Badge>
          <span>Transações criptografadas e registradas na blockchain IMCH via Ethereum</span>
        </div>
      </CardContent>
    </Card>
  );
};
