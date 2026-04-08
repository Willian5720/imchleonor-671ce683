import { useSearchParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { WalletCard } from '@/components/profile/WalletCard';
import { WalletAddresses } from '@/components/profile/WalletAddresses';

export default function WalletPage() {
  const [searchParams] = useSearchParams();
  const autoDeposit = searchParams.get('deposit') === 'true';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Wallet className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Carteira</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus saldos e endereços</p>
          </div>
        </div>

        <WalletCard autoOpenDeposit={autoDeposit} />
        <WalletAddresses />
      </div>
    </div>
  );
}
