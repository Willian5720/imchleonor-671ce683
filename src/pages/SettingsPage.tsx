import { Settings, Moon, Sun, Bell, HelpCircle, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TwoFactorAuth } from '@/components/profile/TwoFactorAuth';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { logAction } = useAuditLog();
  const { isDark, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await logAction('logout', 'auth');
    signOut();
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Settings className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Personalize o aplicativo e gerencie segurança</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance */}
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Aparência
              </CardTitle>
              <CardDescription>Personalize a aparência do aplicativo</CardDescription>
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
              <Button variant="outline" className="w-full justify-start">Central de Ajuda</Button>
              <Button variant="outline" className="w-full justify-start">Termos de Uso</Button>
              <Button variant="outline" className="w-full justify-start">Política de Privacidade</Button>
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
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
