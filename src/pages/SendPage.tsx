import { Send } from 'lucide-react';
import { TransferHub } from '@/components/profile/TransferHub';

export default function SendPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Send className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Enviar</h1>
            <p className="text-sm text-muted-foreground">Transfira fundos para outros usuários</p>
          </div>
        </div>

        <TransferHub />
      </div>
    </div>
  );
}
