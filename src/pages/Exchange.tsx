import { useState } from 'react';
import { KycBadge } from '@/components/profile/KycBadge';
import { KycVerification } from '@/components/profile/KycVerification';
import { Eye, EyeOff, Plus, ArrowDownUp, TrendingUp, TrendingDown, Star, ChevronRight, Gift, Megaphone, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CryptoTicker } from '@/components/crypto/CryptoTicker';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useNavigate } from 'react-router-dom';

export default function Exchange() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin } = useUserRole();
  const { prices, loading: pricesLoading } = useCryptoPrices(15000);
  const { IMCH_TO_USD } = useExchangeRates();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const imchBalance = profile?.coins || 0;
  const usdEquivalent = imchBalance * IMCH_TO_USD;

  const topCryptos = prices.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <CryptoTicker />

      <div className="p-4 pb-8 max-w-4xl mx-auto space-y-6">

        {/* User Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" onClick={() => navigate('/profile')} role="button">
            {profileLoading ? (
              <Skeleton className="w-12 h-12 rounded-full" />
            ) : (
              <Avatar className="w-12 h-12 border-2 border-primary/30">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-medium text-foreground text-sm">
                {profile?.display_name || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {isAdmin && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/50 text-primary">
                    Admin
                  </Badge>
                )}
                <KycBadge />
              </div>
            </div>
          </div>
          <img src="/pwa-192x192.png" alt="IMCHLEONOR" className="w-10 h-10 rounded-xl" />
        </div>

        {/* My Assets Card */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Meus Ativos</span>
                <button onClick={() => setShowBalance(prev => !prev)} className="text-muted-foreground hover:text-foreground">
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate('/profile')}
              >
                Detalhes do Ativo <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {showBalance ? `${imchBalance.toLocaleString()}` : '****'}
                  <span className="text-base font-normal text-muted-foreground ml-2">IMCH</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {showBalance ? `≈ $${usdEquivalent.toFixed(2)} USD` : '≈ $**** USD'}
                </p>
              </div>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate('/profile?tab=wallet&deposit=true')}
              >
                <Plus className="w-4 h-4 mr-1" /> Depósito
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KYC Verification Banner */}
        <KycVerification />

        {/* For You Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Para Você</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Atualizar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">💰</span>
                  <span className="text-xs font-bold text-primary">IMCH</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Ganhe rendimentos com IMCH Coin. APR flexível.</p>
                <p className="text-xs font-bold text-primary mt-2">APR 5.63%</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 cursor-pointer hover:border-secondary/40 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">🏆</span>
                  <span className="text-xs font-bold text-secondary">PONTUAÇÃO</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Complete tarefas simples e ganhe prémios.</p>
                <p className="text-xs font-bold text-secondary mt-2">5 000 000</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">🧩</span>
                  <span className="text-xs font-bold text-amber-500">NOITE</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Caça ao Quebra-Cabeça noturno.</p>
                <p className="text-xs font-bold text-amber-500 mt-2">4 000 000</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Markets Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Mercados</h3>
            <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              Visão geral <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <Tabs defaultValue="hot" className="w-full">
            <TabsList className="h-8 bg-transparent p-0 gap-1 justify-start">
              <TabsTrigger value="favorites" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-muted">
                <Star className="w-3 h-3 mr-1" /> Favoritos
              </TabsTrigger>
              <TabsTrigger value="hot" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-muted">
                🔥 Quente
              </TabsTrigger>
              <TabsTrigger value="gainers" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-muted">
                Ganhadores
              </TabsTrigger>
              <TabsTrigger value="losers" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-muted">
                Perdedores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hot" className="mt-3">
              <MarketTable cryptos={topCryptos} loading={pricesLoading} />
            </TabsContent>
            <TabsContent value="favorites" className="mt-3">
              <p className="text-sm text-muted-foreground text-center py-6">Adicione favoritos clicando na ⭐</p>
            </TabsContent>
            <TabsContent value="gainers" className="mt-3">
              <MarketTable cryptos={[...topCryptos].sort((a, b) => b.change24h - a.change24h).slice(0, 5)} loading={pricesLoading} />
            </TabsContent>
            <TabsContent value="losers" className="mt-3">
              <MarketTable cryptos={[...topCryptos].sort((a, b) => a.change24h - b.change24h).slice(0, 5)} loading={pricesLoading} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Trending Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Eventos em Alta
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/80 border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground">🔄 Compra recorrente de IMCH</p>
                <p className="text-[10px] text-muted-foreground mt-1">Automatize suas compras</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground">🎁 Indique amigos</p>
                <p className="text-[10px] text-muted-foreground mt-1">Ganhe bónus de indicação</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground">📈 Mantenha-se ativo</p>
                <p className="text-[10px] text-muted-foreground mt-1">Receba recompensas diárias</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground">💎 Programa VIP</p>
                <p className="text-[10px] text-muted-foreground mt-1">Taxas com desconto</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Anúncios
            </h3>
            <button className="text-xs text-primary hover:text-primary/80">
              Mais anúncios <ChevronRight className="w-3 h-3 inline" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              'IMCHLEONOR: Negocie criptomoedas com segurança na sua exchange!',
              'Novo: Saques em USDT via rede ERC20 para Bybit, Binance e Redotpay',
              'Atualizações de segurança: Autenticação em duas etapas disponível',
            ].map((msg, i) => (
              <p key={i} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors py-1 border-b border-border/30 last:border-0">
                {msg}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/30 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span>Visão geral do mercado</span>
          <span>•</span>
          <span>Taxas de negociação</span>
          <span>•</span>
          <span>API</span>
          <span>•</span>
          <span>Central de Ajuda</span>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50">
          © 2024 IMCHLEONOR. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

// Market Table Component
function MarketTable({ cryptos, loading }: { cryptos: { symbol: string; name: string; price: number; change24h: number; icon: string }[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (cryptos.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Sem dados disponíveis</p>;
  }

  return (
    <div className="space-y-1">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 py-1 text-[10px] text-muted-foreground">
        <span>Par de negociação</span>
        <span className="text-right w-20">Preço</span>
        <span className="text-right w-16">24h</span>
        <span className="text-right w-12">Troca</span>
      </div>

      {cryptos.map((crypto) => {
        const isPositive = crypto.change24h >= 0;
        return (
          <div
            key={crypto.symbol}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-muted-foreground/40 hover:text-amber-500 cursor-pointer" />
              <span className="text-base">{crypto.icon}</span>
              <div>
                <span className="text-sm font-medium text-foreground">{crypto.symbol}</span>
                <span className="text-muted-foreground text-xs">/USDT</span>
              </div>
            </div>
            <span className="text-sm font-medium text-foreground text-right w-20">
              {crypto.price >= 1 ? crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : crypto.price.toFixed(4)}
            </span>
            <span className={`text-xs text-right w-16 flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
            </span>
            <span className="text-xs text-primary text-right w-12 font-medium">Troca</span>
          </div>
        );
      })}
    </div>
  );
}
