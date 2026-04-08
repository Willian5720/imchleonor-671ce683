import { User, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { KycVerification } from '@/components/profile/KycVerification';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* KYC Verification */}
        <KycVerification />

        {/* Profile Card */}
        <UserProfileCard />

        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-xs text-muted-foreground mb-1">Total Recebido</p>
                <p className="text-xl font-bold text-green-500">--</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                <p className="text-xs text-muted-foreground mb-1">Total Enviado</p>
                <p className="text-xl font-bold text-red-500">--</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-2">Conta criada em</p>
              <p className="text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '--'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
