import { Loader2, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';

interface TransferStatusProps {
  status: 'idle' | 'waiting' | 'processing' | 'completed' | 'failed';
  message: string;
}

export const TransferStatus = ({ status, message }: TransferStatusProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Sparkles className="w-5 h-5 text-primary animate-pulse" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'border-primary/30 bg-primary/5';
      case 'waiting':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'processing':
        return 'border-primary/30 bg-primary/5 animate-pulse';
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'failed':
        return 'border-destructive/30 bg-destructive/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium text-foreground">{message}</span>
    </div>
  );
};
