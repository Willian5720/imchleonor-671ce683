import { ArrowDownLeft, ArrowUpRight, Clock, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useUserTransfers } from '@/hooks/useUserProfile';

export function TransferHistoryList() {
  const { user } = useAuth();
  const { transfers, loading } = useUserTransfers();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Transferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Histórico de Transferências
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma transferência ainda</p>
              <p className="text-sm">Suas transferências aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => {
                const isSent = transfer.from_user_id === user?.id;
                const isReceived = transfer.to_user_id === user?.id;
                
                return (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSent 
                          ? 'bg-red-500/10 text-red-500' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {isSent ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {isSent ? 'Enviado' : 'Recebido'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(transfer.created_at)}
                        </div>
                        {transfer.note && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            "{transfer.note}"
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${isSent ? 'text-red-500' : 'text-green-500'}`}>
                        {isSent ? '-' : '+'}{transfer.amount.toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {transfer.currency}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
