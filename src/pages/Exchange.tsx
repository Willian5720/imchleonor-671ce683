import { ShoppingBag, Bitcoin, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoList } from '@/components/crypto/CryptoList';
import { CryptoTicker } from '@/components/crypto/CryptoTicker';
import { CryptoTrading } from '@/components/crypto/CryptoTrading';

export default function Exchange() {
  return (
    <div className="min-h-screen bg-background">
      {/* Crypto Ticker */}
      <CryptoTicker />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <img src="/pwa-192x192.png" alt="IMCHLEONOR" className="w-16 h-16 rounded-2xl" />
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-primary/80">
                CASA DA CRIPTO IMCH
              </h1>
              <p className="text-muted-foreground">Exchange de Criptomoedas</p>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="trading" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
              <TabsTrigger value="trading" className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Trading
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center gap-2">
                <Bitcoin className="w-4 h-4" />
                Mercado
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Info
              </TabsTrigger>
            </TabsList>

            {/* Trading Tab */}
            <TabsContent value="trading" className="mt-0">
              <CryptoTrading />
            </TabsContent>

            {/* Market Tab */}
            <TabsContent value="market" className="mt-0">
              <CryptoList />
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bybit Info Cards */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">🚀 Spot Trading</h3>
                    <p className="text-sm text-muted-foreground">
                      Compre e venda criptomoedas instantaneamente com preços de mercado em tempo real.
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">📊 Derivativos</h3>
                    <p className="text-sm text-muted-foreground">
                      Negocie contratos futuros e perpétuos com alavancagem de até 100x.
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">💰 Earn</h3>
                    <p className="text-sm text-muted-foreground">
                      Ganhe rendimentos passivos com staking, savings e produtos DeFi.
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">🎁 Launchpad</h3>
                    <p className="text-sm text-muted-foreground">
                      Participe de lançamentos exclusivos de novos tokens e projetos cripto.
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">🤖 Copy Trading</h3>
                    <p className="text-sm text-muted-foreground">
                      Copie automaticamente as estratégias de traders profissionais.
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2">🎮 NFT & Web3</h3>
                    <p className="text-sm text-muted-foreground">
                      Explore o marketplace de NFTs e conecte-se ao ecossistema Web3.
                    </p>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="p-6 rounded-lg bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border border-primary/30 text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Comece a Negociar na Bybit
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua conta e receba bônus de boas-vindas!
                  </p>
                  <a 
                    href="https://www.bybit.com/invite?ref=LPJQ3B7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Criar Conta na Bybit →
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
