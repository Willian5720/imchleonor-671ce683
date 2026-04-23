import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Radio,
  FileWarning,
  Clock,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DuplicateEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: {
    attempted_document_number?: string;
    conflicting_user_ids?: string[];
    [k: string]: unknown;
  };
  risk_level: string;
  created_at: string;
}

const riskColors: Record<string, string> = {
  low: 'bg-green-500/20 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export default function AdminKycDuplicates() {
  const [events, setEvents] = useState<DuplicateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selected, setSelected] = useState<DuplicateEvent | null>(null);
  const [tick, setTick] = useState(0);
  const lastIdRef = useRef<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'kyc_duplicate_document_attempt')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const list = (data as DuplicateEvent[]) || [];
      setEvents((prev) => {
        const newest = list[0]?.id ?? null;
        if (newest && lastIdRef.current && newest !== lastIdRef.current) {
          const newOnes = list.filter(
            (e) => !prev.some((p) => p.id === e.id),
          );
          if (newOnes.length > 0) {
            toast.warning(
              `${newOnes.length} nova(s) tentativa(s) de documento duplicado detectada(s)`,
            );
          }
        }
        lastIdRef.current = newest;
        return list;
      });
    } catch (e) {
      console.error('Error fetching duplicate events:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 1 second
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEvents();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEvents]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kyc-duplicate-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: 'event_type=eq.kyc_duplicate_document_attempt',
        },
        (payload) => {
          const ev = payload.new as DuplicateEvent;
          setEvents((prev) => {
            if (prev.some((p) => p.id === ev.id)) return prev;
            toast.warning('Nova tentativa de documento duplicado!');
            return [ev, ...prev];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (riskFilter !== 'all' && e.risk_level !== riskFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        e.user_id?.toLowerCase().includes(s) ||
        e.ip_address?.toLowerCase().includes(s) ||
        e.details?.attempted_document_number?.toLowerCase().includes(s) ||
        JSON.stringify(e.details).toLowerCase().includes(s)
      );
    });
  }, [events, riskFilter, search]);

  const stats = useMemo(
    () => ({
      total: events.length,
      high: events.filter((e) => e.risk_level === 'high').length,
      critical: events.filter((e) => e.risk_level === 'critical').length,
      uniqueDocs: new Set(
        events
          .map((e) => e.details?.attempted_document_number)
          .filter(Boolean),
      ).size,
    }),
    [events],
  );

  const downloadEvent = (event: DuplicateEvent) => {
    const payload = {
      event_id: event.id,
      detected_at: event.created_at,
      risk_level: event.risk_level,
      attempted_by_user_id: event.user_id,
      attempted_document_number:
        event.details?.attempted_document_number ?? null,
      conflicting_user_ids: event.details?.conflicting_user_ids ?? [],
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      raw_details: event.details,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc-duplicate-${event.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Detalhes baixados');
  };

  const downloadAll = () => {
    if (filtered.length === 0) {
      toast.error('Nenhum evento para baixar');
      return;
    }
    const csv = [
      'event_id,detected_at,risk_level,user_id,document_number,conflicting_user_ids,ip_address,user_agent',
      ...filtered.map((e) =>
        [
          e.id,
          e.created_at,
          e.risk_level,
          e.user_id ?? '',
          e.details?.attempted_document_number ?? '',
          (e.details?.conflicting_user_ids ?? []).join('|'),
          e.ip_address ?? '',
          (e.user_agent ?? '').replace(/,/g, ';'),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc-duplicates-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} eventos exportados`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/20 to-orange-500/20 border border-destructive/30">
              <FileWarning className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-destructive">
                Documentos Duplicados (KYC)
              </h1>
              <p className="text-muted-foreground">
                Monitoramento em tempo real de tentativas de uso do mesmo BI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                autoRefresh
                  ? 'border-green-500/50 text-green-500 gap-2'
                  : 'border-muted text-muted-foreground gap-2'
              }
            >
              <Radio
                className={`h-3 w-3 ${autoRefresh ? 'animate-pulse' : ''}`}
              />
              {autoRefresh ? 'Ao vivo (1s)' : 'Pausado'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((v) => !v)}
            >
              {autoRefresh ? 'Pausar' : 'Retomar'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchEvents()}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total tentativas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.high}</p>
                <p className="text-xs text-muted-foreground">Risco alto</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ShieldAlert className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Crítico</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueDocs}</p>
                <p className="text-xs text-muted-foreground">
                  Documentos distintos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardContent className="p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, documento, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nível de risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os riscos</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAll}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-destructive" />
              Tentativas detectadas
            </CardTitle>
            <CardDescription>
              {filtered.length} evento(s) — atualização automática a cada 1s
              {tick > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (ciclos: {tick})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px]">
              {loading && events.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mb-2" />
                  <p>Nenhuma tentativa registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((event) => {
                    const docNum =
                      event.details?.attempted_document_number ?? '—';
                    const conflicts =
                      event.details?.conflicting_user_ids?.length ?? 0;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/30"
                      >
                        <div className="p-2 rounded-lg bg-destructive/20 mt-1">
                          <FileWarning className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium">
                              Documento: {docNum}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                riskColors[event.risk_level] ||
                                riskColors.medium
                              }
                            >
                              {event.risk_level}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-orange-500/10 text-orange-500 border-orange-500/30"
                            >
                              {conflicts} conflito(s)
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            User: {event.user_id ?? '—'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(
                                new Date(event.created_at),
                                "dd/MM/yyyy 'às' HH:mm:ss",
                                { locale: ptBR },
                              )}
                            </span>
                            {event.ip_address && (
                              <span>IP: {event.ip_address}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(event)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadEvent(event)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
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

      {/* Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-destructive" />
              Detalhes do documento conflitante
            </DialogTitle>
            <DialogDescription>
              Informações completas registradas no momento da tentativa
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Documento</p>
                  <p className="font-mono font-medium">
                    {selected.details?.attempted_document_number ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Risco</p>
                  <Badge
                    variant="outline"
                    className={
                      riskColors[selected.risk_level] || riskColors.medium
                    }
                  >
                    {selected.risk_level}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Usuário tentando
                  </p>
                  <p className="font-mono text-xs break-all">
                    {selected.user_id ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data/hora</p>
                  <p>
                    {format(
                      new Date(selected.created_at),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: ptBR },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">IP</p>
                  <p>{selected.ip_address ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">User-Agent</p>
                  <p className="text-xs break-all">
                    {selected.user_agent ?? '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  Contas em conflito (já cadastradas com este documento)
                </p>
                <div className="space-y-1">
                  {(selected.details?.conflicting_user_ids ?? []).map(
                    (uid) => (
                      <p
                        key={uid}
                        className="font-mono text-xs bg-muted/30 p-2 rounded break-all"
                      >
                        {uid}
                      </p>
                    ),
                  )}
                  {!selected.details?.conflicting_user_ids?.length && (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">
                  Detalhes brutos (JSON)
                </p>
                <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto max-h-48">
                  {JSON.stringify(selected.details, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadEvent(selected)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
