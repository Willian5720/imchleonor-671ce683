import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Send, Clock, Settings, LogOut, Moon, Sun, Bell, HelpCircle, Activity, Wallet, Coins } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { TransferHub } from '@/components/profile/TransferHub';
import { TransferHistoryList } from '@/components/profile/TransferHistoryList';
import { AuditLogList } from '@/components/profile/AuditLogList';
import { TwoFactorAuth } from '@/components/profile/TwoFactorAuth';
import { WalletCard } from '@/components/profile/WalletCard';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';

export default function Profile() {
  const { signOut, user } = useAuth();
  const { logAction } = useAuditLog();
  const { isAdmin } = useUserRole();
  const { isDark, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const autoDeposit = searchParams.get('deposit') === 'true';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({});
  };

  const handleSignOut = async () => {
    await logAction('logout', 'auth');
    signOut();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-primary neon-text-green">
              Meu Perfil
            </h1>
            <div className="p-2 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-500/30">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">Gerencie suas configurações, saldos e transferências</p>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-6 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Carteira</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserProfileCard />
              
              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
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
                            year: 'numeric' 
                          })
                        : '--'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-0">
            <div className="max-w-lg mx-auto">
              <WalletCard autoOpenDeposit={autoDeposit} />
            </div>
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer" className="mt-0">
            <TransferHub />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <TransferHistoryList />
          </TabsContent>

          {/* Audit Log Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="audit" className="mt-0">
              <AuditLogList />
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appearance */}
              <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência do aplicativo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                      <Label>{isDark ? 'Tema Escuro' : 'Tema Claro'}</Label>
                    </div>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <Label>Notificações</Label>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Two Factor Auth */}
              <TwoFactorAuth />

              {/* Help & Support */}
              <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Ajuda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Central de Ajuda
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Termos de Uso
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Política de Privacidade
                  </Button>
                </CardContent>
              </Card>

              {/* Logout */}
              <Card className="bg-gradient-to-br from-destructive/5 to-card border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <LogOut className="w-5 h-5" />
                    Sair da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
