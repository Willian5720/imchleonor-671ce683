import { Gamepad2, LogOut, ShoppingBag, User, Coins, Shield, Boxes } from 'lucide-react';
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

  const menuItems = [
    { title: 'Casa da Cripto', url: '/', icon: ShoppingBag, adminOnly: false },
    { title: 'Meu Perfil', url: '/profile', icon: User, adminOnly: false },
    ...(isAdmin ? [
      { title: 'Blockchain', url: '/blockchain', icon: Boxes, adminOnly: true },
      { title: 'IMCHLEONOR', url: '/game', icon: Gamepad2, adminOnly: true },
      { title: 'Auditoria', url: '/admin/audit', icon: Shield, adminOnly: true },
    ] : []),
  ];

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/pwa-192x192.png" alt="IMCHLEONOR" className="w-8 h-8 rounded-lg" />
          <div>
            <h2 className="font-display text-sm font-bold text-primary neon-text-green">
              CASA DA CRIPTO
            </h2>
            <p className="text-[10px] text-muted-foreground">IMCH</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                        <span className="font-medium">{item.title}</span>
                        {item.adminOnly && (
                          <span className="ml-auto text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex flex-col gap-3">
          {/* User Profile Summary */}
          <NavLink 
            to="/profile" 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
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
                  {profile?.coins?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </NavLink>
          
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
