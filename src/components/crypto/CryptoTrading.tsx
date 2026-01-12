import { useState } from 'react';
import { RefreshCw, TrendingUp, AlertCircle, Star, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CryptoTradingCard } from './CryptoTradingCard';
import { useCryptoPrices, type CryptoPrice } from '@/hooks/useCryptoPrices';

type SortField = 'name' | 'price' | 'change24h' | 'volume24h';
type SortDirection = 'asc' | 'desc';

export function CryptoTrading() {
  const { prices, loading, error, lastUpdated, refetch } = useCryptoPrices(15000);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const sortPrices = (cryptos: CryptoPrice[]) => {
    return [...cryptos].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  };

  const filteredPrices = sortPrices(
    prices.filter(crypto => {
      const matchesSearch = 
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (showFavorites) {
        return matchesSearch && favorites.includes(crypto.symbol);
      }
      
      return matchesSearch;
    })
  );

  const gainers = [...prices].sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const losers = [...prices].sort((a, b) => a.change24h - b.change24h).slice(0, 3);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar preços: {error}
          <Button variant="link" className="ml-2 p-0" onClick={refetch}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      {!loading && prices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Gainers */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Gainers (24h)
            </h3>
            <div className="space-y-2">
              {gainers.map((crypto, i) => (
                <div key={crypto.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="text-xl">{crypto.icon}</span>
                    <span className="font-medium text-foreground">{crypto.symbol}</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                    +{crypto.change24h.toFixed(2)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
            <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 rotate-180" />
              Top Losers (24h)
            </h3>
            <div className="space-y-2">
              {losers.map((crypto, i) => (
                <div key={crypto.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="text-xl">{crypto.icon}</span>
                    <span className="font-medium text-foreground">{crypto.symbol}</span>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    {crypto.change24h.toFixed(2)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Trading de Criptomoedas</h2>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-2">
              • Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refetch}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou símbolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center gap-2"
          >
            <Star className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
            Favoritos
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {favorites.length}
              </Badge>
            )}
          </Button>
          
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="price">Preço</SelectItem>
              <SelectItem value="change24h">Variação 24h</SelectItem>
              <SelectItem value="volume24h">Volume 24h</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Crypto Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && prices.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="w-24 h-4 mb-1" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
              <Skeleton className="w-32 h-8 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-12" />
              </div>
            </div>
          ))
        ) : (
          filteredPrices.map((crypto) => (
            <CryptoTradingCard 
              key={crypto.symbol} 
              crypto={crypto}
              onFavorite={toggleFavorite}
              isFavorite={favorites.includes(crypto.symbol)}
            />
          ))
        )}
      </div>

      {filteredPrices.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFavorites 
              ? 'Nenhum favorito ainda. Clique na ⭐ para adicionar.'
              : 'Nenhuma criptomoeda encontrada.'}
          </p>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Modo Simulação:</strong> As ordens de compra/venda são simuladas para fins educacionais. 
          Para negociar de verdade, clique em "Negociar na Bybit".
        </p>
      </div>
    </div>
  );
}
