import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filter
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

const getActionConfig = (action: string) => {
  return actionConfig[action] || { icon: Activity, label: action, color: 'bg-muted' };
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      // Apply date filter
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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.action === 'login').length,
    signups: logs.filter(l => l.action === 'signup').length,
    transfers: logs.filter(l => l.action === 'transfer_sent').length,
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
            <p className="text-muted-foreground">Monitoramento de todas as atividades do sistema</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nos logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Ação" />
                  </SelectTrigger>
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchLogs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs de Auditoria
            </CardTitle>
            <CardDescription>
              {filteredLogs.length} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2" />
                  <p>Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => {
                    const config = getActionConfig(log.action);
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/30"
                      >
                        <div className={`p-2 rounded-full ${config.color} text-white shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{config.label}</span>
                            {log.entity_type && (
                              <Badge variant="outline" className="text-xs">
                                {log.entity_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            User: {log.user_id?.substring(0, 8)}...
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
