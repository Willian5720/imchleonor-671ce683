import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CryptoCard } from './CryptoCard';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

export function CryptoList() {
  const { prices, loading, error, lastUpdated, refetch } = useCryptoPrices(30000);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Mercado de Criptomoedas</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && prices.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="w-24 h-4 mb-1" />
                  <Skeleton className="w-12 h-3" />
                </div>
              </div>
              <Skeleton className="w-32 h-8 mb-3" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            </div>
          ))
        ) : (
          prices.map((crypto) => (
            <CryptoCard key={crypto.symbol} crypto={crypto} />
          ))
        )}
      </div>

      {prices.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma criptomoeda encontrada.
        </div>
      )}
    </div>
  );
}
