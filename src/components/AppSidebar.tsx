import { Gamepad2, LogOut, ShoppingBag } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
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

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const currentPath = location.pathname;

  const menuItems = [
    { title: 'Boutique', url: '/', icon: ShoppingBag, adminOnly: false },
    ...(isAdmin ? [{ title: 'IMCHLEONOR', url: '/game', icon: Gamepad2, adminOnly: true }] : []),
  ];

  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-background" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-primary neon-text-green">
              LEONOR
            </h2>
            <p className="text-[10px] text-muted-foreground">Boutique</p>
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
          <div className="text-xs text-muted-foreground truncate">
            {user?.email}
          </div>
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
