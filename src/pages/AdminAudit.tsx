import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Activity, 
  RefreshCw, 
  Search, 
  LogIn, 
  LogOut, 
  User, 
  Send, 
  Download, 
  Settings, 
  Key,
  UserPlus,
  Shield,
  Calendar,
  Filter,
  AlertTriangle,
  ShieldAlert,
  Users,
  Eye,
  Clock,
  Globe,
  Monitor,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  risk_level: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  coins: number;
  balance_aoa: number;
  avatar_url: string | null;
  phone: string | null;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  login: { icon: LogIn, label: 'Login', color: 'bg-green-500' },
  logout: { icon: LogOut, label: 'Logout', color: 'bg-gray-500' },
  signup: { icon: UserPlus, label: 'Cadastro', color: 'bg-blue-500' },
  profile_update: { icon: User, label: 'Perfil Atualizado', color: 'bg-purple-500' },
  transfer_sent: { icon: Send, label: 'Transferência Enviada', color: 'bg-orange-500' },
  transfer_received: { icon: Download, label: 'Transferência Recebida', color: 'bg-emerald-500' },
  password_change: { icon: Key, label: 'Senha Alterada', color: 'bg-red-500' },
  settings_update: { icon: Settings, label: 'Configurações', color: 'bg-indigo-500' },
  '2fa_enabled': { icon: Shield, label: '2FA Ativado', color: 'bg-cyan-500' },
  '2fa_disabled': { icon: Shield, label: '2FA Desativado', color: 'bg-yellow-500' },
};

const riskColors: Record<string, string> = {
  low: 'bg-green-500/20 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const getActionConfig = (action: string) => {
  return actionConfig[action] || { icon: Activity, label: action, color: 'bg-muted' };
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userLogsLoading, setUserLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFilter]);

  const fetchSecurityEvents = useCallback(async () => {
    setSecurityLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setSecurityEvents((data as SecurityEvent[]) || []);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchUserLogs = useCallback(async (userId: string) => {
    setUserLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUserLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching user logs:', error);
    } finally {
      setUserLogsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLogs();
    fetchSecurityEvents();
    fetchUsers();
  }, [fetchLogs, fetchSecurityEvents, fetchUsers]);

  // Realtime security monitoring - auto-detect new intrusions
  const [realtimeActive, setRealtimeActive] = useState(true);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  useEffect(() => {
    if (!realtimeActive) return;

    const channel = supabase
      .channel('security-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setSecurityEvents((prev) => [newEvent, ...prev]);
          setLastEventTime(new Date().toISOString());
        }
      )
      .subscribe();

    // Also poll every 30s as a fallback
    const pollInterval = setInterval(() => {
      fetchSecurityEvents();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [realtimeActive, fetchSecurityEvents]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserLogs(selectedUserId);
    }
  }, [selectedUserId, fetchUserLogs]);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user_id?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_type?.toLowerCase().includes(search) ||
      JSON.stringify(log.details).toLowerCase().includes(search)
    );
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.display_name?.toLowerCase().includes(search) ||
      u.id.toLowerCase().includes(search)
    );
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.action === 'login').length,
    signups: logs.filter(l => l.action === 'signup').length,
    transfers: logs.filter(l => l.action === 'transfer_sent').length,
    securityAlerts: securityEvents.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-primary neon-text-green">
              Painel de Auditoria
            </h1>
            <p className="text-muted-foreground">Monitoramento de atividades, segurança e dados de usuários</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <LogIn className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.logins}</p>
                  <p className="text-xs text-muted-foreground">Logins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.signups}</p>
                  <p className="text-xs text-muted-foreground">Cadastros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Send className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.transfers}</p>
                  <p className="text-xs text-muted-foreground">Transferências</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.securityAlerts}</p>
                  <p className="text-xs text-muted-foreground">Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Logs de Atividade
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Dados de Usuários
            </TabsTrigger>
          </TabsList>

          {/* ========== LOGS TAB ========== */}
          <TabsContent value="logs">
            {/* Filters */}
            <Card className="mb-6 bg-gradient-to-br from-card/80 to-card border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar nos logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo de Ação" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Ações</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                        <SelectItem value="logout">Logout</SelectItem>
                        <SelectItem value="signup">Cadastro</SelectItem>
                        <SelectItem value="profile_update">Perfil</SelectItem>
                        <SelectItem value="transfer_sent">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todo Período</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Última Semana</SelectItem>
                        <SelectItem value="month">Último Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs List */}
            <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Logs de Auditoria</CardTitle>
                <CardDescription>{filteredLogs.length} registros encontrados</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-32"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2" /><p>Nenhum log encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredLogs.map((log) => {
                        const config = getActionConfig(log.action);
                        const Icon = config.icon;
                        return (
                          <div key={log.id} className="flex items-start gap-3 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/30">
                            <div className={`p-2 rounded-full ${config.color} text-white shrink-0`}><Icon className="h-4 w-4" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{config.label}</span>
                                {log.entity_type && <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">User: {log.user_id?.substring(0, 8)}...</p>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{JSON.stringify(log.details)}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== SECURITY TAB ========== */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Security Alert Banner */}
              <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-red-500/20">
                      <ShieldAlert className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Monitoramento de Segurança</h3>
                      <p className="text-sm text-muted-foreground">
                        Tentativas de acesso não autorizado, atividades suspeitas e ameaças ao sistema
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={fetchSecurityEvents} disabled={securityLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${securityLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Events List */}
              <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Eventos de Segurança
                  </CardTitle>
                  <CardDescription>
                    {securityEvents.length} eventos registrados — tentativas de invasão e acessos suspeitos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {securityLoading ? (
                      <div className="flex items-center justify-center h-32"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : securityEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Shield className="h-12 w-12 mb-3 text-green-500" />
                        <p className="font-medium text-foreground">Sistema Seguro</p>
                        <p className="text-sm">Nenhuma tentativa de acesso não autorizado detectada</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {securityEvents.map((event) => (
                          <div key={event.id} className="p-4 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-red-500/20 shrink-0">
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium">{event.event_type}</span>
                                  <Badge className={`text-xs border ${riskColors[event.risk_level] || riskColors.low}`}>
                                    {event.risk_level === 'critical' ? '🔴 Crítico' :
                                     event.risk_level === 'high' ? '🟠 Alto' :
                                     event.risk_level === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                                  </Badge>
                                </div>
                                {event.ip_address && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Globe className="h-3 w-3" />
                                    <span>IP: {event.ip_address}</span>
                                  </div>
                                )}
                                {event.user_agent && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Monitor className="h-3 w-3" />
                                    <span className="truncate max-w-md">{event.user_agent}</span>
                                  </div>
                                )}
                                {event.details && Object.keys(event.details).length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-md font-mono">
                                    {JSON.stringify(event.details)}
                                  </p>
                                )}
                                {event.user_id && (
                                  <p className="text-xs text-muted-foreground mt-1 font-mono">User: {event.user_id.substring(0, 8)}...</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">{format(new Date(event.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(event.created_at), "HH:mm:ss", { locale: ptBR })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== USERS DATA TAB ========== */}
          <TabsContent value="users">
            <div className="space-y-6">
              {/* User Search */}
              <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por email, nome ou ID do usuário..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10" />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={usersLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users Table */}
                <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Todos os Usuários ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription>Clique num usuário para ver detalhes e histórico</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {usersLoading ? (
                        <div className="flex items-center justify-center h-32"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Criado em</TableHead>
                              <TableHead>Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((u) => (
                              <TableRow
                                key={u.id}
                                className={`cursor-pointer transition-colors ${selectedUserId === u.id ? 'bg-primary/10' : ''}`}
                                onClick={() => setSelectedUserId(u.id)}
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{u.display_name || 'Sem nome'}</p>
                                    <p className="text-xs text-muted-foreground">{u.email || u.id.substring(0, 12) + '...'}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {u.coins.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* User Detail Panel */}
                <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Detalhes do Usuário
                    </CardTitle>
                    <CardDescription>
                      {selectedUser ? `Análise de dados — ${selectedUser.email || selectedUser.id.substring(0, 12)}` : 'Selecione um usuário para visualizar'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedUser ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <User className="h-10 w-10 mb-3" />
                        <p>Selecione um usuário na lista</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* User Info */}
                        <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{selectedUser.display_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Calendar className="h-3 w-3" />
                                <span>Conta criada</span>
                              </div>
                              <p className="text-sm font-medium">
                                {format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Clock className="h-3 w-3" />
                                <span>Última atualização</span>
                              </div>
                              <p className="text-sm font-medium">
                                {format(new Date(selectedUser.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30">
                              <p className="text-xs text-muted-foreground mb-1">Saldo IMCH</p>
                              <p className="text-sm font-bold text-primary">{selectedUser.coins.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30">
                              <p className="text-xs text-muted-foreground mb-1">Saldo AOA</p>
                              <p className="text-sm font-bold">{selectedUser.balance_aoa.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>

                          {selectedUser.phone && (
                            <p className="text-xs text-muted-foreground">📱 {selectedUser.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono">ID: {selectedUser.id}</p>
                        </div>

                        {/* User Activity History */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Histórico de Atividades ({userLogs.length})
                          </h4>
                          <ScrollArea className="h-[250px]">
                            {userLogsLoading ? (
                              <div className="flex items-center justify-center h-20"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                            ) : userLogs.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
                            ) : (
                              <div className="space-y-2">
                                {userLogs.map((log) => {
                                  const cfg = getActionConfig(log.action);
                                  const LogIcon = cfg.icon;
                                  return (
                                    <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-sm">
                                      <div className={`p-1.5 rounded-full ${cfg.color} text-white shrink-0`}>
                                        <LogIcon className="h-3 w-3" />
                                      </div>
                                      <span className="font-medium flex-1">{cfg.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
