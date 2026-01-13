import { useState } from 'react';
import { Clock, Check, X, AlertTriangle, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTradingHistory, type TradeOrder } from '@/hooks/useTradingHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TradingHistoryProps {
  filterSymbol?: string;
}

export function TradingHistory({ filterSymbol }: TradingHistoryProps) {
  const { orders, pendingOrders, filledOrders, cancelledOrders, cancelOrder, clearHistory } = useTradingHistory();
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: TradeOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'filled':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusLabel = (status: TradeOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'filled':
        return 'Executada';
      case 'cancelled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
    }
  };

  const filterOrders = (ordersList: TradeOrder[]) => {
    return ordersList.filter(order => {
      if (filterSymbol && order.symbol !== filterSymbol) return false;
      if (typeFilter !== 'all' && order.type !== typeFilter) return false;
      return true;
    });
  };

  const OrderRow = ({ order }: { order: TradeOrder }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-colors">
      <div className="flex items-center gap-3">
        {getStatusIcon(order.status)}
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${order.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
              {order.type === 'buy' ? 'Compra' : 'Venda'}
            </span>
            <span className="text-foreground">{order.symbol}</span>
            <Badge variant="outline" className="text-xs">
              {order.orderType === 'market' ? 'Mercado' : order.orderType === 'limit' ? 'Limite' : 'Stop-Limit'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(order.createdAt)}
            {order.limitPrice && ` • Limite: ${formatPrice(order.limitPrice)}`}
            {order.stopPrice && ` • Stop: ${formatPrice(order.stopPrice)}`}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">
            {order.amount.toFixed(6)} × {formatPrice(order.price)}
          </div>
          <div className="text-xs text-muted-foreground">
            Total: {formatPrice(order.total)}
          </div>
        </div>
        
        {order.status === 'pending' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => cancelOrder(order.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8 text-muted-foreground">
      <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Ordens
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-[110px] h-8">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="buy">Compra</SelectItem>
                <SelectItem value="sell">Venda</SelectItem>
              </SelectContent>
            </Select>
            
            {orders.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover todo o histórico de ordens. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Limpar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">
              Todas
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {filterOrders(orders).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {filterOrders(pendingOrders).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="filled">
              Executadas
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {filterOrders(filledOrders).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Canceladas
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {filterOrders(cancelledOrders).length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[350px]">
            <TabsContent value="all" className="mt-0 space-y-2">
              {filterOrders(orders).length === 0 ? (
                <EmptyState message="Nenhuma ordem encontrada" />
              ) : (
                filterOrders(orders).map(order => (
                  <OrderRow key={order.id} order={order} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0 space-y-2">
              {filterOrders(pendingOrders).length === 0 ? (
                <EmptyState message="Nenhuma ordem pendente" />
              ) : (
                filterOrders(pendingOrders).map(order => (
                  <OrderRow key={order.id} order={order} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="filled" className="mt-0 space-y-2">
              {filterOrders(filledOrders).length === 0 ? (
                <EmptyState message="Nenhuma ordem executada" />
              ) : (
                filterOrders(filledOrders).map(order => (
                  <OrderRow key={order.id} order={order} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="mt-0 space-y-2">
              {filterOrders(cancelledOrders).length === 0 ? (
                <EmptyState message="Nenhuma ordem cancelada" />
              ) : (
                filterOrders(cancelledOrders).map(order => (
                  <OrderRow key={order.id} order={order} />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
