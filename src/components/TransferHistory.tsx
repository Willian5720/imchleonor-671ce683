import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { TransferRecord } from '@/hooks/useImchGame';

interface TransferHistoryProps {
  transfers: TransferRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const TransferHistory = ({ transfers, isOpen, onClose }: TransferHistoryProps) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'failed':
        return 'Falhou';
      case 'processing':
        return 'Processando';
      default:
        return 'Pendente';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-bold text-xl text-primary neon-text-green">
            📜 Histórico de Transferências
          </h2>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma transferência realizada ainda.</p>
              <p className="text-sm mt-2">As transferências automáticas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <div 
                  key={transfer.id}
                  className="p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transfer.status)}
                      <span className="font-medium text-sm">
                        {getStatusLabel(transfer.status)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transfer.created_at)}
                    </span>
                  </div>
                  
                  <div className="text-lg font-display font-bold text-secondary">
                    $ {transfer.amount_usdt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {transfer.coins_transferred.toLocaleString('pt-BR')} IMCH Coins
                  </div>
                  
                  {transfer.bybit_transfer_id && (
                    <div className="text-xs text-muted-foreground mt-2 font-mono">
                      ID: {transfer.bybit_transfer_id}
                    </div>
                  )}
                  
                  {transfer.status === 'success' && (
                    <p className="text-xs text-green-500 mt-2">
                      ✓ Transferência realizada com sucesso para a conta Bybit
                    </p>
                  )}
                  
                  {transfer.error_message && (
                    <p className="text-xs text-destructive mt-2">
                      Erro: {transfer.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold hover:bg-primary/90 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
