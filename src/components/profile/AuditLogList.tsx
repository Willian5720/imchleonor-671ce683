import { useAuditLog, AuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  LogIn, 
  LogOut, 
  User, 
  Send, 
  Download, 
  Settings, 
  Key,
  UserPlus,
  Activity,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  login: { icon: LogIn, label: 'Login', color: 'bg-green-500' },
  logout: { icon: LogOut, label: 'Logout', color: 'bg-gray-500' },
  signup: { icon: UserPlus, label: 'Cadastro', color: 'bg-blue-500' },
  profile_update: { icon: User, label: 'Perfil Atualizado', color: 'bg-purple-500' },
  transfer_sent: { icon: Send, label: 'Transferência Enviada', color: 'bg-orange-500' },
  transfer_received: { icon: Download, label: 'Transferência Recebida', color: 'bg-emerald-500' },
  password_change: { icon: Key, label: 'Senha Alterada', color: 'bg-red-500' },
  settings_update: { icon: Settings, label: 'Configurações', color: 'bg-indigo-500' },
};

const getActionConfig = (action: string) => {
  return actionConfig[action] || { icon: Activity, label: action, color: 'bg-muted' };
};

const AuditLogItem = ({ log }: { log: AuditLog }) => {
  const config = getActionConfig(log.action);
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-full ${config.color} text-white`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{config.label}</span>
          {log.entity_type && (
            <Badge variant="outline" className="text-xs">
              {log.entity_type}
            </Badge>
          )}
        </div>
        {log.details && Object.keys(log.details).length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {JSON.stringify(log.details)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
};

export const AuditLogList = () => {
  const { logs, loading, fetchLogs } = useAuditLog();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs de Atividade
          </CardTitle>
          <CardDescription>
            Histórico de todas as suas ações na plataforma
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchLogs()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2" />
              <p>Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
