import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  History,
  ExternalLink,
} from 'lucide-react';
import { DerivTransaction } from '@/hooks/useDerivIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DerivTransactionHistoryProps {
  transactions: DerivTransaction[];
  loading?: boolean;
}

export const DerivTransactionHistory: React.FC<DerivTransactionHistoryProps> = ({
  transactions,
  loading = false,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3" />
            Falhou
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1 bg-gray-500/10 text-gray-500 border-gray-500/20">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Transações Deriv
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação Deriv ainda
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-background/50 rounded-lg p-4 border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          tx.transaction_type === 'deposit'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-green-500/10 text-green-500'
                        }`}
                      >
                        {tx.transaction_type === 'deposit' ? (
                          <ArrowUpFromLine className="h-5 w-5" />
                        ) : (
                          <ArrowDownToLine className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {tx.transaction_type === 'deposit'
                              ? 'Depósito na Deriv'
                              : 'Retirada da Deriv'}
                          </span>
                          {getStatusBadge(tx.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{tx.amount_imch.toLocaleString()} IMCH</span>
                          <span>≈</span>
                          <span>${tx.amount_usd.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {tx.blockchain_ledger_id && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs">
                      <ExternalLink className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Blockchain ID:</span>
                      <code className="font-mono text-primary/80 truncate max-w-[200px]">
                        {tx.blockchain_ledger_id}
                      </code>
                    </div>
                  )}
                  
                  {tx.error_message && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 text-red-500 text-xs">
                      {tx.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
