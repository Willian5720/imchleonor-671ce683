import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export const MainLayout = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  useTheme(); // Initialize theme on every render to keep document class in sync

  if (authLoading) {
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
