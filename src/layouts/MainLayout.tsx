import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useImchGame } from '@/hooks/useImchGame';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MainLayout = () => {
  const { isAuthenticated, loading: authLoading, user, signOut } = useAuth();
  const { isLoading: gameLoading, isAuthorized } = useImchGame();

  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-destructive text-6xl mb-4">🚫</div>
          <h1 className="font-display text-2xl text-destructive mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mb-6">
            O email <span className="text-foreground">{user?.email}</span> não está autorizado a acessar este sistema.
          </p>
          <Button onClick={signOut} variant="destructive" className="font-display">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger />
          </header>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
