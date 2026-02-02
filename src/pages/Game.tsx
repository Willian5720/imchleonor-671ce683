import { useState, useCallback } from 'react';
import { Settings, History, RefreshCw, Send, RotateCcw, DollarSign, ShieldX, Home } from 'lucide-react';
import { useImchGame } from '@/hooks/useImchGame';
import { useSound } from '@/hooks/useSound';
import { MinerButton } from '@/components/MinerButton';
import { ImchCoinDisplay } from '@/components/ImchCoinDisplay';
import { TransferStatus } from '@/components/TransferStatus';
import { TransferHistory } from '@/components/TransferHistory';
import { ImchSettings } from '@/components/ImchSettings';
import { FloatingCoin } from '@/components/FloatingCoin';
import { ManualTransfer } from '@/components/ManualTransfer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface FloatingCoinData {
  id: number;
  x: number;
  y: number;
}

const Game = () => {
  const { 
    coins, 
    threshold,
    transfers,
    isLoading,
    isAuthorized,
    transferStatus,
    statusMessage,
    addCoin,
    updateThreshold,
    getUsdtValue,
    manualTransfer,
    resetCoins,
    refreshData,
  } = useImchGame();
  
  const { playCoinSound, playSuccessSound } = useSound();
  const { toast } = useToast();

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoinData[]>([]);
  const [coinIdCounter, setCoinIdCounter] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleMine = useCallback(async (e: React.MouseEvent) => {
    playCoinSound();
    
    const newCoin: FloatingCoinData = {
      id: coinIdCounter,
      x: e.clientX,
      y: e.clientY,
    };
    
    setFloatingCoins(prev => [...prev, newCoin]);
    setCoinIdCounter(prev => prev + 1);
    
    const success = await addCoin(1);
    
    if (success && transferStatus === 'completed') {
      playSuccessSound();
      toast({
        title: "🎉 Transferência Automática!",
        description: "Seus USDT foram transferidos para a Bybit!",
      });
    }
  }, [addCoin, playCoinSound, playSuccessSound, coinIdCounter, transferStatus, toast]);

  const handleFloatingCoinComplete = useCallback((id: number) => {
    setFloatingCoins(prev => prev.filter(coin => coin.id !== id));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    toast({
      title: "Dados atualizados",
      description: "Informações sincronizadas com sucesso.",
    });
  }, [refreshData, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-primary font-display text-2xl animate-pulse neon-text-green mb-2">
            IMCHLEONOR
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show access denied screen for non-admin users
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-3">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mb-6">
            Este sistema é exclusivo para administradores. 
            Você não tem permissão para acessar o IMCHLEONOR.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const usdtValue = getUsdtValue();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-green/5 via-transparent to-transparent" />
      
      {/* Top bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-10 h-10 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card hover:border-primary/50 transition-all group"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="w-10 h-10 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card hover:border-primary/50 transition-all group"
        >
          <History className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card hover:border-primary/50 transition-all group"
        >
          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Floating coins */}
      {floatingCoins.map(coin => (
        <FloatingCoin
          key={coin.id}
          id={coin.id}
          x={coin.x}
          y={coin.y}
          onComplete={handleFloatingCoinComplete}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="font-display font-black text-4xl md:text-5xl text-primary neon-text-green mb-2">
            IMCHLEONOR
          </h1>
          <p className="text-muted-foreground text-sm">
            1 IMCH Coin = 100 USDT
          </p>
        </div>

        {/* Transfer Status */}
        <TransferStatus status={transferStatus} message={statusMessage} />

        {/* Coin display */}
        <ImchCoinDisplay 
          coins={coins} 
          usdtValue={usdtValue} 
          threshold={threshold}
        />

        {/* Miner button */}
        <MinerButton onClick={handleMine} />

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Button
            onClick={() => setShowManualTransfer(true)}
            disabled={coins <= 0 || transferStatus === 'processing'}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-display"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Transferir Valor
          </Button>
          <Button
            onClick={async () => {
              const success = await manualTransfer();
              if (success) {
                playSuccessSound();
                toast({
                  title: "🎉 Transferência Manual!",
                  description: "Todos os USDT foram transferidos para a Bybit!",
                });
              }
            }}
            disabled={coins <= 0 || transferStatus === 'processing'}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 font-display"
          >
            <Send className="w-4 h-4 mr-2" />
            Transferir Tudo
          </Button>
          <Button
            onClick={async () => {
              const success = await resetCoins();
              if (success) {
                toast({
                  title: "🔄 Saldo Resetado",
                  description: "Seus coins foram zerados.",
                });
              }
            }}
            disabled={coins <= 0 || transferStatus === 'processing'}
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 font-display"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button
            onClick={() => setShowHistory(true)}
            variant="outline"
            className="border-secondary/50 text-secondary hover:bg-secondary/10 font-display"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground/50 text-xs mt-6 text-center">
          🔒 Transferências automáticas via Bybit API<br />
          <span className="text-primary/50">Sistema 100% automático</span>
        </p>
      </div>

      {/* Manual Transfer Modal */}
      <ManualTransfer
        isOpen={showManualTransfer}
        onClose={() => setShowManualTransfer(false)}
        onTransfer={async (coinsAmount) => {
          const success = await manualTransfer(coinsAmount);
          if (success) {
            playSuccessSound();
            toast({
              title: "🎉 Transferência Manual!",
              description: `${(coinsAmount * 100).toFixed(2)} USDT transferidos para a Bybit!`,
            });
          }
          return success;
        }}
        currentCoins={coins}
        isProcessing={transferStatus === 'processing'}
      />

      {/* Settings Modal */}
      <ImchSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        threshold={threshold}
        onUpdateThreshold={updateThreshold}
      />

      {/* History Modal */}
      <TransferHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        transfers={transfers}
      />
    </div>
  );
};

export default Game;
