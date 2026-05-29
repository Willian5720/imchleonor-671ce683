import { useState, useEffect } from 'react';
import { Play, Pause, Activity, RefreshCw, AlertCircle, History, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function TradingBot() {
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Bot inicializado. Aguardando comando...']);
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bybit-bot', {
        body: { action: 'status' }
      });
      
      if (error) throw error;
      if (data?.success) {
        setBalance(data.balance);
        setOrders(data.orders || []);
      }
    } catch (err: any) {
      console.error('Error fetching bot status:', err);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com a Bybit. Verifique as chaves.",
        variant: "destructive"
      });
    }
  };

  const runAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    addLog('Solicitando análise de mercado...');
    
    try {
      const { data, error } = await supabase.functions.invoke('bybit-bot', {
        body: { action: 'analyze_and_trade' }
      });
      
      if (error) throw error;
      
      if (data?.success && data.logs) {
        data.logs.forEach((log: string) => addLog(log));
      } else if (data?.error) {
        addLog(`Erro: ${data.error}`);
      }
      
      fetchStatus();
    } catch (err: any) {
      addLog(`Falha na execução: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-run when bot is active
  useEffect(() => {
    let interval: number;
    if (isRunning) {
      addLog('Modo automático ativado (Análises a cada 1 hora).');
      // Run immediately
      runAnalysis();
      // Then set interval (e.g. 1 hour = 3600000 ms)
      interval = window.setInterval(runAnalysis, 3600000);
    } else {
      if (logs.length > 1) {
        addLog('Bot pausado.');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Bot Trader Bybit</h1>
            <p className="text-sm text-muted-foreground">Operações automáticas baseadas em análise técnica</p>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-green-500 hover:bg-green-600" : ""}>
            {isRunning ? "Ativo" : "Pausado"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Control Panel */}
          <Card className="col-span-1 border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Painel de Controle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Saldo Bybit (USDT)</span>
                </div>
                <p className="text-2xl font-bold">
                  {balance !== null ? `$${balance.toFixed(2)}` : '---'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setIsRunning(!isRunning)} 
                  className={`w-full ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {isRunning ? (
                    <><Pause className="w-4 h-4 mr-2" /> Pausar Bot Automático</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Iniciar Bot Automático</>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Forçar Análise Agora
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-md border border-primary/20 flex gap-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <p>O bot analisa os históricos dos mercados disponíveis na Bybit e executa ordens apenas em padrões confirmados de alta/baixa, respeitando os limites mínimos de entrada de cada par.</p>
              </div>

            </CardContent>
          </Card>

          {/* Logs */}
          <Card className="col-span-1 md:col-span-2 border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Logs de Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border border-border/30 bg-black/40 p-4 font-mono text-sm">
                {logs.map((log, i) => (
                  <div key={i} className={`mb-1 ${
                    log.includes('✅') ? 'text-green-400' : 
                    log.includes('🚨') ? 'text-amber-400' : 
                    log.includes('ALTA') ? 'text-blue-400' :
                    log.includes('BAIXA') ? 'text-red-400' :
                    'text-gray-300'
                  }`}>
                    {log}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}