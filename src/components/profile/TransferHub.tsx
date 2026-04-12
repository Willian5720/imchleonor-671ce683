import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Users,
  ArrowUpRight,
  Coins,
  Loader2,
  AlertCircle,
  Wallet,
  Info,
} from 'lucide-react';
import { useUserProfile, useUserTransfers, useSearchUsers, SearchUserResult } from '@/hooks/useUserProfile';
import { useDerivIntegration } from '@/hooks/useDerivIntegration';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast as sonnerToast } from 'sonner';

type TransferType = 'p2p' | 'deriv' | 'bybit' | 'binance' | 'redotpay';

const DerivLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#FF444F] flex items-center justify-center">
    <span className="text-white font-bold text-xs">D</span>
  </div>
);

const BybitLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#F7A600] flex items-center justify-center">
    <span className="text-black font-bold text-xs">B</span>
  </div>
);

const BinanceLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#F0B90B] flex items-center justify-center">
    <span className="text-black font-bold text-xs">BN</span>
  </div>
);

const RedotpayLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#E8373E] flex items-center justify-center">
    <span className="text-white font-bold text-xs">R</span>
  </div>
);

export function TransferHub() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useUserProfile();
  const { sendTransfer } = useUserTransfers();
  const { searchByEmail, searching: searchingUsers } = useSearchUsers();
  const { deposit: depositToDeriv, loading: derivLoading } = useDerivIntegration();
  const { IMCH_TO_USD } = useExchangeRates();

  const [selectedType, setSelectedType] = useState<TransferType | null>(null);

  // P2P States
  const [recipientEmail, setRecipientEmail] = useState('');
  const [p2pAmount, setP2pAmount] = useState('');
  const [p2pNote, setP2pNote] = useState('');
  const [p2pSending, setP2pSending] = useState(false);
  const [p2pError, setP2pError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchUserResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Real-time search with debounce
  useEffect(() => {
    if (selectedRecipient) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (recipientEmail.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchByEmail(recipientEmail);
      setSearchResults(results);
      setShowResults(results.length > 0);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipientEmail, selectedRecipient]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectRecipient = (u: SearchUserResult) => {
    setSelectedRecipient(u);
    setRecipientEmail(u.email_hint || u.display_name || '');
    setShowResults(false);
    setSearchResults([]);
  };

  const clearRecipient = () => {
    setSelectedRecipient(null);
    setRecipientEmail('');
    setSearchResults([]);
  };
  // Deriv States
  const [derivAmount, setDerivAmount] = useState('');

  // Bybit States
  const [bybitAmount, setBybitAmount] = useState('');
  const [bybitAddress, setBybitAddress] = useState('');
  const [bybitProcessing, setBybitProcessing] = useState(false);

  // Binance States
  const [binanceAmount, setBinanceAmount] = useState('');
  const [binanceAddress, setBinanceAddress] = useState('');
  const [binanceProcessing, setBinanceProcessing] = useState(false);

  // Redotpay States
  const [redotpayAmount, setRedotpayAmount] = useState('');
  const [redotpayAddress, setRedotpayAddress] = useState('');
  const [redotpayProcessing, setRedotpayProcessing] = useState(false);

  const balance = profile?.coins || 0;

  // P2P Transfer Handler
  const handleP2PTransfer = async () => {
    setP2pError(null);
    const amountNum = parseFloat(p2pAmount);

    if (!recipientEmail || !amountNum || amountNum <= 0) {
      setP2pError('Preencha todos os campos corretamente.');
      return;
    }
    if (amountNum > balance) {
      setP2pError('Saldo insuficiente.');
      return;
    }

    setP2pSending(true);
    const result = await sendTransfer(recipientEmail, amountNum, p2pNote || undefined);
    setP2pSending(false);

    if (result.success) {
      toast({ title: 'Transferência realizada!', description: `${amountNum} COINS enviados` });
      setRecipientEmail('');
      setP2pAmount('');
      setP2pNote('');
      setSelectedType(null);
      refetchProfile();
    } else {
      setP2pError(result.error || 'Erro ao transferir');
    }
  };

  // Deriv Transfer Handler
  const handleDerivTransfer = async () => {
    const amount = parseFloat(derivAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > balance) {
      sonnerToast.error('Saldo insuficiente');
      return;
    }

    try {
      await depositToDeriv(amount);
      setDerivAmount('');
      setSelectedType(null);
      refetchProfile();
    } catch {
      // Error handled in hook
    }
  };

  // Generic ERC20 withdrawal handler (used by Bybit, Binance, Redotpay)
  const handleERC20Withdrawal = async (
    amount: string,
    address: string,
    platform: string,
    setProcessing: (v: boolean) => void,
    resetFields: () => void,
  ) => {
    const amountNum = parseFloat(amount);
    if (!address || isNaN(amountNum) || amountNum <= 0) return;

    const usdtValue = amountNum * 100;
    if (usdtValue < 1) {
      sonnerToast.error('Valor mínimo é 1 USDT');
      return;
    }
    if (amountNum > balance) {
      sonnerToast.error('Saldo insuficiente');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      sonnerToast.error('Endereço ERC20 inválido');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('bybit-transfer', {
        body: {
          action: 'withdraw_to_wallet',
          coins: amountNum,
          wallet_address: address,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro no saque');

      sonnerToast.success(`${usdtValue.toFixed(2)} USDT enviados para ${platform}!`);
      resetFields();
      setSelectedType(null);
      refetchProfile();
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : 'Erro ao processar saque');
    } finally {
      setProcessing(false);
    }
  };

  const handleBybitTransfer = () =>
    handleERC20Withdrawal(bybitAmount, bybitAddress, 'Bybit', setBybitProcessing, () => {
      setBybitAmount('');
      setBybitAddress('');
    });

  const handleBinanceTransfer = () =>
    handleERC20Withdrawal(binanceAmount, binanceAddress, 'Binance', setBinanceProcessing, () => {
      setBinanceAmount('');
      setBinanceAddress('');
    });

  const handleRedotpayTransfer = () =>
    handleERC20Withdrawal(redotpayAmount, redotpayAddress, 'Redotpay', setRedotpayProcessing, () => {
      setRedotpayAmount('');
      setRedotpayAddress('');
    });

  const transferOptions = [
    {
      type: 'p2p' as TransferType,
      title: 'Usuário IMCHLEONOR',
      description: 'Enviar COINS para outro usuário da plataforma',
      icon: <Users className="w-6 h-6 text-primary" />,
      color: 'from-primary/20 to-primary/5 border-primary/30',
    },
    {
      type: 'deriv' as TransferType,
      title: 'Deriv',
      description: 'Depositar IMCH na sua conta Deriv',
      icon: <DerivLogo />,
      color: 'from-[#FF444F]/20 to-[#FF444F]/5 border-[#FF444F]/30',
    },
    {
      type: 'bybit' as TransferType,
      title: 'Bybit',
      description: 'Sacar USDT para sua carteira Bybit',
      icon: <BybitLogo />,
      color: 'from-[#F7A600]/20 to-[#F7A600]/5 border-[#F7A600]/30',
    },
    {
      type: 'binance' as TransferType,
      title: 'Binance',
      description: 'Sacar USDT para sua carteira Binance',
      icon: <BinanceLogo />,
      color: 'from-[#F0B90B]/20 to-[#F0B90B]/5 border-[#F0B90B]/30',
    },
    {
      type: 'redotpay' as TransferType,
      title: 'Redotpay',
      description: 'Sacar USDT para sua carteira Redotpay',
      icon: <RedotpayLogo />,
      color: 'from-[#E8373E]/20 to-[#E8373E]/5 border-[#E8373E]/30',
    },
  ];

  // Selection View
  if (!selectedType) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seu saldo disponível</p>
                  <p className="text-2xl font-bold text-primary">{balance.toLocaleString()} COINS</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Equivalente</p>
                <p className="text-lg font-semibold text-muted-foreground">
                  ≈ ${(balance * IMCH_TO_USD).toFixed(2)} USD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transferOptions.map((option) => (
            <Card
              key={option.type}
              className={`bg-gradient-to-br ${option.color} cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => setSelectedType(option.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-background/50">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // P2P Transfer Form
  if (selectedType === 'p2p') {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50 max-w-lg mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSelectedType(null)}>← Voltar</Button>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Enviar para Usuário IMCHLEONOR
          </CardTitle>
          <CardDescription>Transfira COINS para outro usuário da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleP2PTransfer(); }} className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seu saldo</span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold text-primary">{balance.toLocaleString()}</span>
              </div>
            </div>

            {p2pError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{p2pError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Email do Destinatário</Label>
              <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="usuario@exemplo.com" className="bg-background/50" />
            </div>

            <div className="space-y-2">
              <Label>Quantidade (COINS)</Label>
              <Input type="number" value={p2pAmount} onChange={(e) => setP2pAmount(e.target.value)} placeholder="0" min="1" className="bg-background/50" />
              <div className="flex gap-2 flex-wrap">
                {[10, 50, 100, 500].map((qa) => (
                  <Button key={qa} type="button" variant="outline" size="sm" className="text-xs" onClick={() => setP2pAmount(qa.toString())} disabled={qa > balance}>{qa}</Button>
                ))}
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setP2pAmount(balance.toString())} disabled={balance <= 0}>Máx</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Textarea value={p2pNote} onChange={(e) => setP2pNote(e.target.value)} placeholder="Adicione uma mensagem..." className="bg-background/50 min-h-[60px]" />
            </div>

            <Button type="submit" className="w-full" disabled={p2pSending}>
              {p2pSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar Transferência
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Deriv Transfer Form
  if (selectedType === 'deriv') {
    const derivAmountNum = parseFloat(derivAmount) || 0;
    const usdValue = derivAmountNum * IMCH_TO_USD;

    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50 max-w-lg mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSelectedType(null)}>← Voltar</Button>
          <CardTitle className="text-lg flex items-center gap-2"><DerivLogo /> Depositar na Deriv</CardTitle>
          <CardDescription>Converta IMCH Coins em saldo USD na sua conta Deriv</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Seu saldo IMCH</span>
            <span className="text-xl font-bold text-primary">{balance.toLocaleString()}</span>
          </div>

          <div className="space-y-2">
            <Label>Quantidade (IMCH)</Label>
            <Input type="number" value={derivAmount} onChange={(e) => setDerivAmount(e.target.value)} placeholder="0" min="1" className="bg-background/50" />
            <div className="flex gap-2 flex-wrap">
              {[100, 500, 1000, 5000].map((amt) => (
                <Button key={amt} type="button" variant="outline" size="sm" className="text-xs" onClick={() => setDerivAmount(amt.toString())} disabled={amt > balance}>{amt.toLocaleString()}</Button>
              ))}
            </div>
          </div>

          {derivAmountNum > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Você envia:</span>
                <span className="font-medium">{derivAmountNum.toLocaleString()} IMCH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Você recebe:</span>
                <span className="font-medium text-green-500">${usdValue.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          <Button onClick={handleDerivTransfer} disabled={derivLoading || derivAmountNum <= 0 || derivAmountNum > balance} className="w-full">
            {derivLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
            Depositar na Deriv
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ERC20 Withdrawal Form (Bybit, Binance, Redotpay)
  const erc20Config: Record<string, { logo: JSX.Element; name: string; amount: string; setAmount: (v: string) => void; address: string; setAddress: (v: string) => void; processing: boolean; handler: () => void }> = {
    bybit: { logo: <BybitLogo />, name: 'Bybit', amount: bybitAmount, setAmount: setBybitAmount, address: bybitAddress, setAddress: setBybitAddress, processing: bybitProcessing, handler: handleBybitTransfer },
    binance: { logo: <BinanceLogo />, name: 'Binance', amount: binanceAmount, setAmount: setBinanceAmount, address: binanceAddress, setAddress: setBinanceAddress, processing: binanceProcessing, handler: handleBinanceTransfer },
    redotpay: { logo: <RedotpayLogo />, name: 'Redotpay', amount: redotpayAmount, setAmount: setRedotpayAmount, address: redotpayAddress, setAddress: setRedotpayAddress, processing: redotpayProcessing, handler: handleRedotpayTransfer },
  };

  const config = erc20Config[selectedType];
  if (config) {
    const amountNum = parseFloat(config.amount) || 0;
    const usdtValue = amountNum * 100;
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(config.address);

    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50 max-w-lg mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSelectedType(null)}>← Voltar</Button>
          <CardTitle className="text-lg flex items-center gap-2">{config.logo} Sacar para {config.name}</CardTitle>
          <CardDescription>Envie USDT para sua carteira {config.name} via ERC20 (Ethereum)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Seu saldo</span>
            <div className="text-right">
              <span className="text-xl font-bold text-primary">{balance.toLocaleString()} IMCH</span>
              <span className="text-xs text-muted-foreground block">≈ {(balance * 100).toFixed(2)} USDT</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantidade (IMCH)</Label>
            <Input type="number" value={config.amount} onChange={(e) => config.setAmount(e.target.value)} placeholder="0" step="0.0001" className="bg-background/50" />
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100].map((percent) => (
                <Button key={percent} type="button" variant="outline" size="sm" className="text-xs" onClick={() => config.setAmount(((balance * percent) / 100).toFixed(4))} disabled={balance <= 0}>{percent}%</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Endereço ERC20 ({config.name})
            </Label>
            <Input type="text" value={config.address} onChange={(e) => config.setAddress(e.target.value.trim())} placeholder="0x..." className="bg-background/50 font-mono text-sm" />
            {config.address && !isValidAddress && (
              <p className="text-destructive text-xs">Endereço inválido. Use um endereço ERC20 válido.</p>
            )}
          </div>

          {amountNum > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Você recebe:</span>
                <span className="text-primary">{usdtValue.toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          {usdtValue > 0 && usdtValue < 10 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A rede ERC20 exige mínimo de 10 USDT por transferência.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={config.handler} disabled={config.processing || amountNum <= 0 || amountNum > balance || !isValidAddress || usdtValue < 1} className="w-full">
            {config.processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
            Sacar para {config.name}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
