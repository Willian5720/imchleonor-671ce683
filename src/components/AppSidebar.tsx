import { User, LogOut, Coins, Clock, Settings, Shield, Wallet, FileText, Lock, HelpCircle, Boxes, Gamepad2, Send, Home } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const { profile } = useUserProfile();
  const currentPath = location.pathname;

  const accountItems = [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Meu Perfil', url: '/profile', icon: User },
    { title: 'Carteira', url: '/wallet', icon: Wallet, tour: 'sidebar-wallet' },
    { title: 'Enviar', url: '/send', icon: Send, tour: 'sidebar-send' },
    { title: 'Histórico', url: '/history', icon: Clock, tour: 'sidebar-history' },
  ];

  const settingsItems = [
    { title: 'Configurações', url: '/settings', icon: Settings, tour: 'sidebar-settings' },
  ];

  const adminItems = isAdmin ? [
    { title: 'Blockchain', url: '/blockchain', icon: Boxes },
    { title: 'IMCHLEONOR', url: '/game', icon: Gamepad2 },
    { title: 'Auditoria', url: '/admin/audit', icon: Shield },
  ] : [];

  const infoItems = [
    { title: 'Central de Ajuda', url: '#', icon: HelpCircle },
    { title: 'Termos de Uso', url: '#', icon: FileText },
    { title: 'Privacidade', url: '#', icon: Lock },
  ];

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const isActive = (url: string) => {
    if (url === '/') return currentPath === '/';
    return currentPath === url;
  };

  const renderMenuItems = (items: Array<{ title: string; url: string; icon: typeof Home; tour?: string }>) => (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActive(item.url);
        return (
          <SidebarMenuItem key={item.title} data-tour={item.tour}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              <NavLink
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  active
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
                <span className="text-sm">{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b border-border">
        <NavLink to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar className="w-10 h-10 border border-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.display_name || user?.email?.split('@')[0]}
            </p>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">
                {profile?.coins?.toLocaleString() || 0} IMCH
              </span>
            </div>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(accountItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(settingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(adminItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Informações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(infoItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
