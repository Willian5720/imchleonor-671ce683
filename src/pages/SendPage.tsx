import { Send, ShieldAlert } from 'lucide-react';
import { TransferHub } from '@/components/profile/TransferHub';
import { useKycStatus } from '@/hooks/useKycStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KycVerification } from '@/components/profile/KycVerification';

export default function SendPage() {
  const { isVerified, loading } = useKycStatus();

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

        {!loading && !isVerified ? (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Verificação obrigatória</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Para enviar ou transferir fundos, você precisa primeiro verificar a sua identidade com o Bilhete de Identidade angolano.
                  </p>
                </div>
              </CardContent>
            </Card>
            <KycVerification />
          </div>
        ) : (
          <TransferHub />
        )}
      </div>
    </div>
  );
}
