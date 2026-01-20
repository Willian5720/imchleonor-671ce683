import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  ArrowRightLeft,
  History,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';
import { DerivTransferForm } from '@/components/blockchain/DerivTransferForm';
import { DerivTransactionHistory } from '@/components/blockchain/DerivTransactionHistory';
import { BlockchainExplorer } from '@/components/blockchain/BlockchainExplorer';
import { useDerivIntegration } from '@/hooks/useDerivIntegration';

const Blockchain = () => {
  const { transactions, blockchainBlocks, loading } = useDerivIntegration();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Boxes className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Blockchain IMCH
              </h1>
              <p className="text-muted-foreground">
                Transferências seguras com tecnologia blockchain integrada à Deriv
              </p>
            </div>
          </div>
          
          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Criptografia SHA-256
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              Confirmação Instantânea
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              Integrado com Deriv
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total de Blocos</p>
            <p className="text-2xl font-bold text-primary">
              {blockchainBlocks.length}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Transações Deriv</p>
            <p className="text-2xl font-bold text-green-500">
              {transactions.length}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Volume Total (IMCH)</p>
            <p className="text-2xl font-bold">
              {transactions
                .reduce((acc, tx) => acc + tx.amount_imch, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Main content */}
        <Tabs defaultValue="transfer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="transfer" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transferir
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="explorer" className="gap-2">
              <Boxes className="h-4 w-4" />
              Explorer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transfer">
            <div className="max-w-2xl">
              <DerivTransferForm />
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <DerivTransactionHistory transactions={transactions} loading={loading} />
          </TabsContent>
          
          <TabsContent value="explorer">
            <BlockchainExplorer blocks={blockchainBlocks} loading={loading} />
          </TabsContent>
        </Tabs>
        
        {/* Info section */}
        <div className="bg-card/30 backdrop-blur rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Sobre a Blockchain IMCH
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Segurança</h4>
              <p>
                Cada transação é registrada em um bloco com hash criptográfico SHA-256,
                garantindo imutabilidade e rastreabilidade completa.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Integração Deriv</h4>
              <p>
                Converta suas IMCH Coins para saldo USD na Deriv para trading,
                ou retire seus ganhos de volta para IMCH Coins.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Confirmação Instantânea</h4>
              <p>
                As transações são confirmadas instantaneamente com 6 confirmações
                automáticas, sem necessidade de esperar mineração.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Taxa de Câmbio</h4>
              <p>
                A taxa de conversão atual é de 1 IMCH = $0.01 USD.
                Todas as taxas são fixas e transparentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blockchain;
