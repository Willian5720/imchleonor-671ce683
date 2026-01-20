import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Boxes,
  Hash,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { BlockchainBlock } from '@/hooks/useDerivIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockchainExplorerProps {
  blocks: BlockchainBlock[];
  loading?: boolean;
}

export const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({
  blocks,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredBlocks = blocks.filter(
    (block) =>
      block.current_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.block_number.toString().includes(searchTerm)
  );

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Depósito',
      withdrawal: 'Retirada',
      transfer: 'Transferência',
      mining: 'Mineração',
      deriv_deposit: 'Depósito Deriv',
      deriv_withdrawal: 'Retirada Deriv',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'deriv_withdrawal':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'withdrawal':
      case 'deriv_deposit':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'mining':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
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
          <Boxes className="h-5 w-5 text-primary" />
          Blockchain Explorer
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por hash, tipo ou número do bloco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {blocks.length === 0
              ? 'Nenhuma transação na blockchain ainda'
              : 'Nenhum resultado encontrado'}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="relative group"
                >
                  {/* Connection line */}
                  {index < filteredBlocks.length - 1 && (
                    <div className="absolute left-6 top-full h-3 w-0.5 bg-border" />
                  )}
                  
                  <div className="bg-background/50 rounded-lg p-4 border border-border hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-mono font-bold">
                          #{block.block_number}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getTransactionTypeColor(block.transaction_type)}
                            >
                              {getTransactionTypeLabel(block.transaction_type)}
                            </Badge>
                            {getStatusIcon(block.status)}
                            <span className="text-xs text-muted-foreground">
                              {block.confirmations} confirmações
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-foreground">
                              {block.amount.toLocaleString()} {block.currency}
                            </span>
                            {block.from_address && block.to_address && (
                              <>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">
                                  {truncateHash(block.to_address)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {format(new Date(block.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    
                    {/* Hash info */}
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Hash:</span>
                        <code className="font-mono text-primary/80 flex-1 truncate">
                          {truncateHash(block.current_hash)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyHash(block.current_hash)}
                        >
                          {copiedHash === block.current_hash ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Hash className="h-3 w-3 text-muted-foreground opacity-50" />
                        <span className="text-muted-foreground">Anterior:</span>
                        <code className="font-mono text-muted-foreground/70 flex-1 truncate">
                          {truncateHash(block.previous_hash)}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
