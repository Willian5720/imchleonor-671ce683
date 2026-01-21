import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  Copy,
  Plus,
  Check,
  Coins,
  CircleDollarSign,
} from 'lucide-react';
import { useUserWallets } from '@/hooks/useUserWallets';
import { toast } from 'sonner';

export const WalletAddresses: React.FC = () => {
  const { wallets, loading, generateAddress } = useUserWallets();
  const [generating, setGenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(address);
    toast.success('Endereço copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async (type: string) => {
    setGenerating(type);
    await generateAddress(type);
    setGenerating(null);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'ethereum':
        return <CircleDollarSign className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const imchWallets = wallets.filter(w => w.wallet_type === 'imch');
  const ethWallets = wallets.filter(w => w.wallet_type === 'ethereum');

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Endereços de Carteira
        </CardTitle>
        <CardDescription>
          Seus endereços únicos para receber IMCH e Ethereum
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IMCH Wallets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              IMCH Coin
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerate('imch')}
              disabled={generating === 'imch'}
            >
              <Plus className="h-3 w-3 mr-1" />
              {generating === 'imch' ? 'Gerando...' : 'Novo'}
            </Button>
          </div>
          {imchWallets.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum endereço IMCH gerado ainda
              </p>
            </div>
          ) : (
            imchWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getWalletIcon(wallet.wallet_type)}
                  <code className="text-xs font-mono">
                    {formatAddress(wallet.address)}
                  </code>
                  {wallet.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleCopy(wallet.address)}
                >
                  {copied === wallet.address ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Ethereum Wallets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-blue-500" />
              Ethereum (ETH)
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerate('ethereum')}
              disabled={generating === 'ethereum'}
            >
              <Plus className="h-3 w-3 mr-1" />
              {generating === 'ethereum' ? 'Gerando...' : 'Novo'}
            </Button>
          </div>
          {ethWallets.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum endereço Ethereum gerado ainda
              </p>
            </div>
          ) : (
            ethWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getWalletIcon(wallet.wallet_type)}
                  <code className="text-xs font-mono">
                    {formatAddress(wallet.address)}
                  </code>
                  {wallet.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleCopy(wallet.address)}
                >
                  {copied === wallet.address ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <span className="text-primary">SHA-256</span> - Todos os endereços são gerados com criptografia segura
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
